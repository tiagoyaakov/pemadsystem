#!/usr/bin/env node

/**
 * Script para verificação pré-deploy na Vercel
 * Executa uma série de verificações para garantir que o projeto esteja
 * pronto para ser implantado na Vercel.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

// Função para imprimir mensagens coloridas
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCESSO]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[AVISO]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERRO]${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}\n`),
};

// Variáveis globais
let errorCount = 0;
let warningCount = 0;

// Função para verificar se um arquivo existe
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Função para executar um comando e retornar sua saída
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    return error.stdout || error.message;
  }
}

// Verificar arquivos essenciais para o PWA
function checkPWAFiles() {
  log.section('Verificando arquivos do PWA');

  const pwaFiles = [
    { path: 'public/manifest.json', name: 'Manifesto do PWA' },
    { path: 'public/sw.js', name: 'Service Worker' },
    { path: 'public/offline.html', name: 'Página Offline' },
    { path: 'public/icons', name: 'Diretório de ícones' },
  ];

  for (const file of pwaFiles) {
    if (fileExists(file.path)) {
      log.success(`${file.name} encontrado: ${file.path}`);
    } else {
      log.error(`${file.name} não encontrado: ${file.path}`);
      errorCount++;
    }
  }

  // Verificar ícones do PWA
  if (fileExists('public/icons')) {
    const iconSizes = ['72x72', '96x96', '128x128', '144x144', '152x152', '192x192', '384x384', '512x512'];
    let missingIcons = [];

    for (const size of iconSizes) {
      if (!fileExists(`public/icons/icon-${size}.png`)) {
        missingIcons.push(size);
      }
    }

    if (missingIcons.length > 0) {
      log.warning(`Ícones faltando: ${missingIcons.join(', ')}`);
      warningCount++;
    } else {
      log.success('Todos os ícones do PWA estão presentes');
    }
  }
}

// Verificar configuração da Vercel
function checkVercelConfig() {
  log.section('Verificando configuração da Vercel');

  if (fileExists('vercel.json')) {
    log.success('Arquivo vercel.json encontrado');
    
    try {
      const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
      
      // Verificar configurações essenciais
      const requiredFields = ['framework', 'buildCommand', 'installCommand'];
      const missingFields = requiredFields.filter(field => !vercelConfig[field]);
      
      if (missingFields.length > 0) {
        log.error(`Campos obrigatórios faltando no vercel.json: ${missingFields.join(', ')}`);
        errorCount++;
      } else {
        log.success('vercel.json contém as configurações básicas necessárias');
      }
      
      // Verificar headers para arquivos do PWA
      const hasPWAHeaders = vercelConfig.headers && vercelConfig.headers.some(
        header => ['/sw.js', '/service-worker.js'].includes(header.source)
      );
      
      if (!hasPWAHeaders) {
        log.warning('vercel.json não tem headers otimizados para arquivos do PWA');
        warningCount++;
      } else {
        log.success('Headers para PWA configurados corretamente');
      }
    } catch (error) {
      log.error(`Erro ao analisar vercel.json: ${error.message}`);
      errorCount++;
    }
  } else {
    log.error('Arquivo vercel.json não encontrado');
    errorCount++;
  }
}

// Verificar variáveis de ambiente
function checkEnvironmentVariables() {
  log.section('Verificando variáveis de ambiente');

  if (fileExists('.env.example')) {
    const envExample = fs.readFileSync('.env.example', 'utf8');
    const envVars = envExample.split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('#'))
      .map(line => line.split('=')[0].trim());

    log.info(`Variáveis de ambiente requeridas: ${envVars.join(', ')}`);
    
    // Verificar se existe .env.local para desenvolvimento
    if (fileExists('.env.local')) {
      log.success('Arquivo .env.local encontrado para desenvolvimento local');
    } else {
      log.warning('Arquivo .env.local não encontrado. Necessário para desenvolvimento local.');
      warningCount++;
    }
    
    // Verificar se existe .env.production para produção
    if (fileExists('.env.production')) {
      log.success('Arquivo .env.production encontrado');
    } else {
      log.warning('Arquivo .env.production não encontrado. Considere criar para produção.');
      warningCount++;
    }
    
    // Lembrete sobre variáveis de ambiente na Vercel
    log.info('Lembre-se de configurar as variáveis de ambiente no dashboard da Vercel');
  } else {
    log.error('Arquivo .env.example não encontrado');
    errorCount++;
  }
}

// Verificar dependências e scripts
function checkDependencies() {
  log.section('Verificando dependências e scripts');

  if (fileExists('package.json')) {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // Verificar dependências essenciais
      const essentialDeps = ['next', 'react', 'react-dom', 'next-pwa', 'idb'];
      const missingDeps = essentialDeps.filter(dep => 
        !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
      );
      
      if (missingDeps.length > 0) {
        log.error(`Dependências essenciais faltando: ${missingDeps.join(', ')}`);
        errorCount++;
      } else {
        log.success('Todas as dependências essenciais estão presentes');
      }
      
      // Verificar scripts necessários
      const requiredScripts = ['build', 'start'];
      const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
      
      if (missingScripts.length > 0) {
        log.error(`Scripts necessários faltando: ${missingScripts.join(', ')}`);
        errorCount++;
      } else {
        log.success('Todos os scripts necessários estão presentes');
      }
      
      // Verificar se há dependências obsoletas ou conflitantes
      log.info('Executando verificação de dependências...');
      const npmOutput = runCommand('npm ls --depth=0');
      
      if (npmOutput.includes('UNMET DEPENDENCY') || npmOutput.includes('UNMET PEER DEPENDENCY')) {
        log.warning('Há dependências não atendidas. Considere resolver antes do deploy:');
        console.log(npmOutput.split('\n').filter(line => 
          line.includes('UNMET DEPENDENCY') || line.includes('UNMET PEER DEPENDENCY')
        ).join('\n'));
        warningCount++;
      } else {
        log.success('Dependências estão consistentes');
      }
    } catch (error) {
      log.error(`Erro ao analisar package.json: ${error.message}`);
      errorCount++;
    }
  } else {
    log.error('Arquivo package.json não encontrado');
    errorCount++;
  }
}

// Executar um build de teste
function testBuild() {
  log.section('Executando build de teste');

  log.info('Iniciando build de teste...');
  const buildOutput = runCommand('npm run build');
  
  if (buildOutput.includes('Failed to compile')) {
    log.error('Build falhou. Corrija os erros antes de fazer deploy:');
    console.log(buildOutput);
    errorCount++;
  } else if (buildOutput.includes('warning')) {
    log.warning('Build concluído com avisos:');
    console.log(buildOutput.split('\n').filter(line => line.includes('warning')).join('\n'));
    warningCount++;
  } else {
    log.success('Build concluído com sucesso');
  }
}

// Verificar se há lint warnings/errors
function checkLinting() {
  log.section('Verificando lint');

  // Verificar se há lint script
  if (fileExists('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.scripts && packageJson.scripts.lint) {
      log.info('Executando lint...');
      const lintOutput = runCommand('npm run lint');
      
      if (lintOutput.includes('error')) {
        log.error('Lint falhou com erros:');
        console.log(lintOutput.split('\n').filter(line => line.includes('error')).join('\n'));
        errorCount++;
      } else if (lintOutput.includes('warning')) {
        log.warning('Lint completado com avisos:');
        console.log(lintOutput.split('\n').filter(line => line.includes('warning')).join('\n'));
        warningCount++;
      } else {
        log.success('Lint completado sem erros ou avisos');
      }
    } else {
      log.warning('Script de lint não encontrado no package.json');
      warningCount++;
    }
  }
}

// Verificar tamanho do bundle
function checkBundleSize() {
  log.section('Verificando tamanho do bundle');

  if (fileExists('.next/build-manifest.json') && fileExists('.next/server/pages')) {
    let totalSize = 0;
    
    function calculateDirSize(directory) {
      const files = fs.readdirSync(directory, { withFileTypes: true });
      
      for (const file of files) {
        const filePath = path.join(directory, file.name);
        
        if (file.isDirectory()) {
          calculateDirSize(filePath);
        } else {
          totalSize += fs.statSync(filePath).size;
        }
      }
    }
    
    calculateDirSize('.next');
    
    // Converter para MB
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    
    log.info(`Tamanho total do bundle: ${totalSizeMB} MB`);
    
    if (totalSizeMB > 50) {
      log.warning('O bundle é bastante grande (>50MB). Considere otimizar para melhor performance.');
      warningCount++;
    } else {
      log.success('Tamanho do bundle está dentro de limites razoáveis');
    }
  } else {
    log.warning('Build não encontrado. Execute o build antes de verificar o tamanho do bundle.');
    warningCount++;
  }
}

// Função principal
async function main() {
  log.section('VERIFICAÇÃO PRÉ-DEPLOY PARA VERCEL');
  log.info('Iniciando verificações de pré-deploy...');

  // Verificações
  checkPWAFiles();
  checkVercelConfig();
  checkEnvironmentVariables();
  checkDependencies();
  checkLinting();
  testBuild();
  checkBundleSize();

  // Resumo
  log.section('RESUMO');
  if (errorCount === 0 && warningCount === 0) {
    log.success('Todas as verificações passaram! O projeto está pronto para deploy na Vercel.');
  } else {
    if (errorCount > 0) {
      log.error(`${errorCount} erro(s) encontrado(s). Corrija antes de fazer deploy.`);
    }
    if (warningCount > 0) {
      log.warning(`${warningCount} aviso(s) encontrado(s). Recomendamos resolver antes do deploy.`);
    }
  }

  // Se tiver erros, sair com código diferente de zero
  if (errorCount > 0) {
    process.exit(1);
  }
}

// Executar script
main().catch(error => {
  log.error(`Erro ao executar verificações: ${error.message}`);
  process.exit(1);
}); 