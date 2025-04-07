import { test, expect } from '@playwright/test';
import { launch } from 'puppeteer-core';
import lighthouse from 'lighthouse';
import { writeFileSync } from 'fs';
import { join } from 'path';

const PERFORMANCE_THRESHOLDS = {
  performance: 0.8,
  accessibility: 0.9,
  'best-practices': 0.9,
  seo: 0.9,
  pwa: 0.7
};

test.describe('Performance Tests', () => {
  test('should meet performance thresholds', async ({ page }) => {
    // Configurar Chrome para Lighthouse
    const browser = await launch({
      executablePath: process.env.CHROME_PATH,
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
    writeFileSync(
      join(__dirname, '../lighthouse-report.html'),
      reportHtml
    );

    // Validar métricas
    Object.keys(PERFORMANCE_THRESHOLDS).forEach(metric => {
      const score = lhr.categories[metric].score;
      expect(score, `${metric} score should meet threshold`).toBeGreaterThanOrEqual(
        PERFORMANCE_THRESHOLDS[metric]
      );
    });

    // Validar métricas específicas
    const metrics = lhr.audits;
    
    // First Contentful Paint
    expect(metrics['first-contentful-paint'].numericValue).toBeLessThan(2000);
    
    // Time to Interactive
    expect(metrics['interactive'].numericValue).toBeLessThan(3500);
    
    // Total Blocking Time
    expect(metrics['total-blocking-time'].numericValue).toBeLessThan(300);
    
    // Largest Contentful Paint
    expect(metrics['largest-contentful-paint'].numericValue).toBeLessThan(2500);
    
    // Cumulative Layout Shift
    expect(metrics['cumulative-layout-shift'].numericValue).toBeLessThan(0.1);

    await browser.close();
  });

  test('should handle load under stress', async ({ page }) => {
    // Simular conexão lenta 3G
    await page.emulateNetworkConditions({
      offline: false,
      downloadThroughput: (750 * 1024) / 8,
      uploadThroughput: (250 * 1024) / 8,
      latency: 100
    });

    const startTime = Date.now();
    await page.goto('http://localhost:3000');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);

    // Verificar tempo de resposta dos componentes principais
    const componentTimings = await page.evaluate(() => {
      const performance = window.performance;
      const entries = performance.getEntriesByType('measure');
      return entries.reduce((acc, entry) => {
        acc[entry.name] = entry.duration;
        return acc;
      }, {});
    });

    Object.entries(componentTimings).forEach(([component, timing]) => {
      expect(timing).toBeLessThan(1000);
    });
  });

  test('should maintain performance with multiple users', async ({ page }) => {
    const NUM_CONCURRENT_USERS = 10;
    const MAX_RESPONSE_TIME = 2000;

    const simulateUserAction = async () => {
      const startTime = Date.now();
      await page.goto('http://localhost:3000');
      await page.click('button[type="submit"]');
      return Date.now() - startTime;
    };

    const userSimulations = Array(NUM_CONCURRENT_USERS)
      .fill(null)
      .map(() => simulateUserAction());

    const responseTimes = await Promise.all(userSimulations);
    
    responseTimes.forEach(time => {
      expect(time).toBeLessThan(MAX_RESPONSE_TIME);
    });

    const avgResponseTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
    expect(avgResponseTime).toBeLessThan(MAX_RESPONSE_TIME * 0.8);
  });
}); 