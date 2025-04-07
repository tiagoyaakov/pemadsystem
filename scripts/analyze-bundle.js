const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.cyan}Analisando o tamanho do pacote Next.js para deploy na Vercel...${colors.reset}\n`);

// Verificar se @next/bundle-analyzer está instalado
try {
  require.resolve('@next/bundle-analyzer');
  console.log(`${colors.green}✓ @next/bundle-analyzer está instalado${colors.reset}`);
} catch (error) {
  console.log(`${colors.yellow}! Instalando @next/bundle-analyzer...${colors.reset}`);
  execSync('npm install --save-dev @next/bundle-analyzer', { stdio: 'inherit' });
}

// Criar configuração temporária para análise
const analyzeConfigPath = path.join(__dirname, '../next.analyze.js');
const nextConfigPath = path.join(__dirname, '../next.config.ts');
const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');

const analyzeConfig = `
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: true,
});

${nextConfigContent.replace('export default config', 'module.exports = withBundleAnalyzer(config)')}
`;

fs.writeFileSync(analyzeConfigPath, analyzeConfig);

console.log(`\n${colors.blue}Construindo o aplicativo com análise de pacote...${colors.reset}\n`);

try {
  // Executar build com a configuração de análise
  execSync('ANALYZE=true NODE_ENV=production next build', {
    stdio: 'inherit',
    env: { ...process.env, NEXT_CONFIG_FILE: analyzeConfigPath }
  });
  
  console.log(`\n${colors.green}Análise de pacote concluída com sucesso!${colors.reset}`);
  console.log(`${colors.cyan}Os resultados foram salvos em .next/analyze/client.html e .next/analyze/server.html${colors.reset}`);
  
  // Sugestões para otimização
  console.log(`\n${colors.magenta}Sugestões para otimização do pacote:${colors.reset}`);
  console.log(`${colors.yellow}1. Verifique dependências grandes e considere alternativas menores${colors.reset}`);
  console.log(`${colors.yellow}2. Use dynamic imports para componentes grandes que não são necessários no carregamento inicial${colors.reset}`);
  console.log(`${colors.yellow}3. Considere usar a opção next/image para otimizar imagens${colors.reset}`);
  console.log(`${colors.yellow}4. Verifique se há código duplicado em diferentes pacotes${colors.reset}`);
  
} catch (error) {
  console.error(`\n${colors.red}Erro durante a análise do pacote:${colors.reset}`, error);
} finally {
  // Limpar configuração temporária
  fs.unlinkSync(analyzeConfigPath);
  console.log(`\n${colors.green}Configuração temporária de análise removida${colors.reset}`);
} 