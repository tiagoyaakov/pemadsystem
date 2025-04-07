#!/usr/bin/env node

/**
 * Script para executar todos os tipos de testes implementados no PEMAD
 * Uso: node scripts/run-all-tests.js [--skip-e2e] [--skip-load] [--skip-accessibility]
 */

const { spawn } = require('child_process');
const { exit } = require('process');

// Opções via linha de comando
const args = process.argv.slice(2);
const skipE2E = args.includes('--skip-e2e');
const skipLoad = args.includes('--skip-load');
const skipAccessibility = args.includes('--skip-accessibility');
const skipPerformance = args.includes('--skip-performance');
const verbose = args.includes('--verbose');

// Configurações
const config = {
  unitTests: { command: 'npm', args: ['run', 'test:ci'], name: 'Testes unitários' },
  e2eTests: { command: 'npm', args: ['run', 'test:e2e'], name: 'Testes E2E', skip: skipE2E },
  accessibilityTests: { 
    command: 'npx', 
    args: ['jest', '--testMatch=**/accessibility/**/*.test.{ts,tsx}'], 
    name: 'Testes de acessibilidade',
    skip: skipAccessibility
  },
  performanceTests: { 
    command: 'npm', 
    args: ['run', 'test:perf'], 
    name: 'Testes de performance',
    skip: skipPerformance
  },
  loadTests: { 
    command: 'npx', 
    args: ['k6', 'run', 'load-tests/service-worker-load.js', '--duration', '30s'], 
    name: 'Testes de carga',
    skip: skipLoad
  }
};

// Status de execução
let hasErrors = false;
let currentTest = null;
let results = {};

// Cores para console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Executa um comando em uma subprocesso
 * @param {string} command Comando a ser executado
 * @param {string[]} args Argumentos do comando
 * @param {string} name Nome descritivo do teste
 * @returns {Promise<boolean>} Promessa que resolve para true se o comando foi bem-sucedido
 */
function runCommand(command, args, name) {
  return new Promise((resolve) => {
    console.log(`${colors.blue}▶ Executando ${colors.cyan}${name}${colors.blue}...${colors.reset}`);
    console.log(`${colors.blue}  Comando: ${colors.white}${command} ${args.join(' ')}${colors.reset}`);
    console.log('');
    
    currentTest = name;
    
    const startTime = Date.now();
    const childProcess = spawn(command, args, { stdio: verbose ? 'inherit' : 'pipe' });
    let output = '';
    
    if (!verbose && childProcess.stdout) {
      childProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
    }
    
    if (!verbose && childProcess.stderr) {
      childProcess.stderr.on('data', (data) => {
        output += data.toString();
      });
    }
    
    childProcess.on('close', (code) => {
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      const success = code === 0;
      const status = success 
        ? `${colors.green}✓ SUCESSO${colors.reset}` 
        : `${colors.red}✗ FALHA${colors.reset}`;
      
      console.log(`${colors.blue}◼ Finalizado ${colors.cyan}${name}${colors.blue} - ${status} em ${colors.yellow}${duration}s${colors.reset}`);
      console.log('');
      
      if (!success) {
        hasErrors = true;
        
        if (!verbose) {
          console.log(`${colors.red}Saída do comando:${colors.reset}`);
          console.log(output);
          console.log('');
        }
      }
      
      results[name] = {
        success,
        duration: `${duration}s`,
        command: `${command} ${args.join(' ')}`
      };
      
      resolve(success);
    });
  });
}

/**
 * Executa todos os testes em sequência
 */
async function runAllTests() {
  console.log(`${colors.magenta}=================================${colors.reset}`);
  console.log(`${colors.magenta}  EXECUÇÃO DE TESTES DO PEMAD${colors.reset}`);
  console.log(`${colors.magenta}=================================${colors.reset}`);
  console.log('');
  
  const startTime = Date.now();
  
  for (const [key, test] of Object.entries(config)) {
    if (test.skip) {
      console.log(`${colors.yellow}⏩ Pulando ${colors.cyan}${test.name}${colors.reset}`);
      console.log('');
      results[test.name] = { skipped: true };
      continue;
    }
    
    await runCommand(test.command, test.args, test.name);
  }
  
  const endTime = Date.now();
  const totalDuration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Exibir resumo
  console.log(`${colors.magenta}=================================${colors.reset}`);
  console.log(`${colors.magenta}  RESUMO DOS TESTES${colors.reset}`);
  console.log(`${colors.magenta}=================================${colors.reset}`);
  console.log('');
  
  for (const [name, result] of Object.entries(results)) {
    if (result.skipped) {
      console.log(`${colors.yellow}⏩ ${name}: Pulado${colors.reset}`);
    } else {
      const status = result.success
        ? `${colors.green}✓ SUCESSO${colors.reset}`
        : `${colors.red}✗ FALHA${colors.reset}`;
      console.log(`${status} ${colors.cyan}${name}${colors.reset} (${colors.yellow}${result.duration}${colors.reset})`);
    }
  }
  
  console.log('');
  console.log(`${colors.magenta}Tempo total: ${colors.yellow}${totalDuration}s${colors.reset}`);
  console.log('');
  
  if (hasErrors) {
    console.log(`${colors.red}✗ Alguns testes falharam!${colors.reset}`);
    exit(1);
  } else {
    console.log(`${colors.green}✓ Todos os testes foram bem-sucedidos!${colors.reset}`);
    exit(0);
  }
}

// Tratamento de sinais para terminar com graça
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}⚠ Interrompido pelo usuário durante ${currentTest}${colors.reset}`);
  exit(1);
});

// Executar todos os testes
runAllTests().catch((error) => {
  console.error(`${colors.red}Erro inesperado:${colors.reset}`, error);
  exit(1);
}); 