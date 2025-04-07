import { launch } from 'puppeteer-core';
import lighthouse from 'lighthouse';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const METRICS_FILE = join(__dirname, '../performance-metrics.json');
const REPORT_FILE = join(__dirname, '../performance-report.html');
const HISTORY_FILE = join(__dirname, '../performance-history.json');

interface PerformanceMetrics {
  timestamp: string;
  scores: {
    performance: number;
    accessibility: number;
    'best-practices': number;
    seo: number;
    pwa: number;
  };
  metrics: {
    'first-contentful-paint': number;
    'largest-contentful-paint': number;
    'first-input-delay': number;
    'cumulative-layout-shift': number;
    'total-blocking-time': number;
    'speed-index': number;
  };
}

async function runPerformanceAudit(): Promise<void> {
  try {
    // Iniciar Chrome para Lighthouse
    const browser = await launch({
      executablePath: process.env.CHROME_PATH || 'chrome',
      args: ['--remote-debugging-port=9222']
    });

    // Executar auditoria Lighthouse
    const { lhr } = await lighthouse('http://localhost:3000', {
      port: 9222,
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa']
    });

    // Gerar relatório HTML
    const reportHtml = lighthouse.generateReport(lhr, 'html');
    writeFileSync(REPORT_FILE, reportHtml);

    // Extrair métricas
    const metrics: PerformanceMetrics = {
      timestamp: new Date().toISOString(),
      scores: {
        performance: lhr.categories.performance.score,
        accessibility: lhr.categories.accessibility.score,
        'best-practices': lhr.categories['best-practices'].score,
        seo: lhr.categories.seo.score,
        pwa: lhr.categories.pwa.score
      },
      metrics: {
        'first-contentful-paint': lhr.audits['first-contentful-paint'].numericValue,
        'largest-contentful-paint': lhr.audits['largest-contentful-paint'].numericValue,
        'first-input-delay': lhr.audits['max-potential-fid'].numericValue,
        'cumulative-layout-shift': lhr.audits['cumulative-layout-shift'].numericValue,
        'total-blocking-time': lhr.audits['total-blocking-time'].numericValue,
        'speed-index': lhr.audits['speed-index'].numericValue
      }
    };

    // Salvar métricas atuais
    writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));

    // Atualizar histórico
    let history: PerformanceMetrics[] = [];
    if (existsSync(HISTORY_FILE)) {
      history = JSON.parse(readFileSync(HISTORY_FILE, 'utf-8'));
    }
    history.push(metrics);
    writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

    // Análise de tendências
    if (history.length > 1) {
      const previous = history[history.length - 2];
      const current = metrics;

      console.log('\nAnálise de Tendências:');
      Object.entries(current.scores).forEach(([metric, score]) => {
        const diff = score - previous.scores[metric];
        const trend = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
        console.log(`${metric}: ${Math.round(score * 100)}% ${trend}`);
      });

      // Alertar sobre regressões significativas
      const significantRegressions = Object.entries(current.scores)
        .filter(([metric, score]) => {
          const previousScore = previous.scores[metric];
          return score < previousScore && (previousScore - score) > 0.05;
        });

      if (significantRegressions.length > 0) {
        console.error('\nALERTA: Regressões significativas detectadas:');
        significantRegressions.forEach(([metric, score]) => {
          console.error(`${metric}: ${Math.round(score * 100)}% (queda de ${Math.round((previous.scores[metric] - score) * 100)}%)`);
        });
      }
    }

    await browser.close();
    console.log(`\nRelatório salvo em: ${REPORT_FILE}`);
    console.log(`Métricas salvas em: ${METRICS_FILE}`);

  } catch (error) {
    console.error('Erro ao executar auditoria:', error);
    process.exit(1);
  }
}

runPerformanceAudit(); 