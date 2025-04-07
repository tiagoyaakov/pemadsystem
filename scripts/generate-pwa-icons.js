/**
 * Script para gerar ícones PWA automaticamente
 * Este script gera ícones PWA em vários tamanhos a partir de uma imagem base.
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Cores para saída do console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

// Configuração
const CONFIG = {
  sourceImage: path.join(__dirname, '../assets/logo.png'),
  outputDir: path.join(__dirname, '../public'),
  pwaDir: path.join(__dirname, '../public'),
  manifestFile: path.join(__dirname, '../public/manifest.json'),
  iconSizes: [128, 144, 152, 192, 384, 512],
  badgeSize: 96,
  shortcutIconSizes: [96, 192],
  screenshotSizes: [
    { width: 1280, height: 720 },
    { width: 1920, height: 1080 }
  ],
  background: '#b91c1c', // red-700
  iconName: 'pemad-icon'
};

// Verifica se as dependências estão instaladas
function checkDependencies() {
  try {
    require.resolve('sharp');
    console.log(`${colors.green}✓${colors.reset} Sharp está instalado`);
  } catch (e) {
    console.error(`${colors.red}✗${colors.reset} Sharp não está instalado. Instale com: npm install sharp`);
    process.exit(1);
  }
}

// Verifica se a imagem base existe
function checkSourceImage() {
  if (!fs.existsSync(CONFIG.sourceImage)) {
    console.error(`${colors.red}✗${colors.reset} Imagem base não encontrada: ${CONFIG.sourceImage}`);
    console.log(`${colors.yellow}!${colors.reset} Coloque uma imagem 'logo.png' no diretório 'assets/'`);
    process.exit(1);
  }
}

// Cria diretórios necessários
function createDirectories() {
  const iconsDir = path.join(CONFIG.outputDir, 'icons');
  const screenshotsDir = path.join(CONFIG.outputDir, 'screenshots');
  
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    console.log(`${colors.green}✓${colors.reset} Diretório de saída criado: ${CONFIG.outputDir}`);
  }
  
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log(`${colors.green}✓${colors.reset} Diretório de ícones criado: ${iconsDir}`);
  }
  
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    console.log(`${colors.green}✓${colors.reset} Diretório de screenshots criado: ${screenshotsDir}`);
  }
}

// Gera ícones PWA em diferentes tamanhos
async function generateIcons() {
  const iconsDir = path.join(CONFIG.outputDir, 'icons');
  
  // Gerar ícones PWA padrão
  for (const size of CONFIG.iconSizes) {
    const filename = `${CONFIG.iconName}-${size}x${size}.png`;
    const outputPath = path.join(iconsDir, filename);
    
    await sharp(CONFIG.sourceImage)
      .resize(size, size)
      .png()
      .toFile(outputPath);
      
    console.log(`${colors.green}✓${colors.reset} Ícone ${size}x${size} gerado: ${filename}`);
  }
  
  // Gerar ícone de badge
  const badgeFilename = `${CONFIG.iconName}-badge.png`;
  const badgePath = path.join(iconsDir, badgeFilename);
  
  await sharp(CONFIG.sourceImage)
    .resize(CONFIG.badgeSize, CONFIG.badgeSize)
    .png()
    .toFile(badgePath);
    
  console.log(`${colors.green}✓${colors.reset} Ícone de badge gerado: ${badgeFilename}`);
  
  // Gerar ícones de atalho
  for (const size of CONFIG.shortcutIconSizes) {
    const filename = `${CONFIG.iconName}-shortcut-${size}x${size}.png`;
    const outputPath = path.join(iconsDir, filename);
    
    await sharp(CONFIG.sourceImage)
      .resize(size, size)
      .png()
      .toFile(outputPath);
      
    console.log(`${colors.green}✓${colors.reset} Ícone de atalho ${size}x${size} gerado: ${filename}`);
  }
}

// Gera screenshots padrão
async function generateScreenshots() {
  const screenshotsDir = path.join(CONFIG.outputDir, 'screenshots');
  
  // Criar uma imagem base para screenshots
  const colors = ['#b91c1c', '#b45309', '#15803d', '#1d4ed8'];
  let index = 0;
  
  for (const size of CONFIG.screenshotSizes) {
    const filename = `screenshot-${size.width}x${size.height}.png`;
    const outputPath = path.join(screenshotsDir, filename);
    
    // Criar screenshot com gradiente e texto
    const color = colors[index % colors.length];
    
    // Criar imagem base com cor sólida
    const baseImage = await sharp({
      create: {
        width: size.width,
        height: size.height,
        channels: 4,
        background: color
      }
    }).png().toBuffer();
    
    // Salvar screenshot
    await sharp(baseImage)
      .toFile(outputPath);
      
    console.log(`${colors.green}✓${colors.reset} Screenshot ${size.width}x${size.height} gerado: ${filename}`);
    index++;
  }
}

// Atualizar o manifesto com os novos ícones
function updateManifest() {
  if (!fs.existsSync(CONFIG.manifestFile)) {
    console.log(`${colors.yellow}!${colors.reset} Arquivo de manifesto não encontrado: ${CONFIG.manifestFile}`);
    console.log(`${colors.yellow}!${colors.reset} Pulando atualização do manifesto`);
    return;
  }
  
  try {
    const manifest = require(CONFIG.manifestFile);
    
    // Atualizar ícones
    manifest.icons = CONFIG.iconSizes.map(size => ({
      src: `/icons/${CONFIG.iconName}-${size}x${size}.png`,
      sizes: `${size}x${size}`,
      type: 'image/png',
      purpose: 'any'
    }));
    
    // Adicionar ícones maskable
    CONFIG.iconSizes.forEach(size => {
      manifest.icons.push({
        src: `/icons/${CONFIG.iconName}-${size}x${size}.png`,
        sizes: `${size}x${size}`,
        type: 'image/png',
        purpose: 'maskable'
      });
    });
    
    // Atualizar screenshots
    manifest.screenshots = CONFIG.screenshotSizes.map(size => ({
      src: `/screenshots/screenshot-${size.width}x${size.height}.png`,
      sizes: `${size.width}x${size.height}`,
      type: 'image/png',
      form_factor: size.width > size.height ? 'wide' : 'narrow'
    }));
    
    // Atualizar atalhos (se existir)
    if (manifest.shortcuts) {
      manifest.shortcuts.forEach(shortcut => {
        if (shortcut.icons) {
          shortcut.icons = CONFIG.shortcutIconSizes.map(size => ({
            src: `/icons/${CONFIG.iconName}-shortcut-${size}x${size}.png`,
            sizes: `${size}x${size}`,
            type: 'image/png'
          }));
        }
      });
    }
    
    // Salvar manifesto atualizado
    fs.writeFileSync(CONFIG.manifestFile, JSON.stringify(manifest, null, 2));
    console.log(`${colors.green}✓${colors.reset} Manifesto atualizado com novos ícones e screenshots`);
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Erro ao atualizar manifesto:`, error);
  }
}

// Função principal
async function main() {
  console.log(`${colors.bright}${colors.blue}=== Gerador de Ícones PWA ====${colors.reset}`);
  
  checkDependencies();
  checkSourceImage();
  createDirectories();
  
  try {
    await generateIcons();
    await generateScreenshots();
    updateManifest();
    
    console.log(`\n${colors.bright}${colors.green}Todos os ícones foram gerados com sucesso!${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.bright}${colors.red}Erro ao gerar ícones:${colors.reset}`, error);
    process.exit(1);
  }
}

main(); 