import { test, expect } from '@playwright/test';

test.describe('Form Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should fill and submit a complete form', async ({ page }) => {
    // Preencher o nome
    await page.getByLabel('Nome').fill('João Silva');
    await expect(page.getByLabel('Nome')).toHaveValue('João Silva');

    // Selecionar o estado
    await page.getByLabel('Estado').selectOption('mg');
    await expect(page.getByLabel('Estado')).toHaveValue('mg');

    // Selecionar a data
    await page.getByLabel('Data de Nascimento').click();
    await page.getByRole('button', { name: '15' }).click();
    await expect(page.getByLabel('Data de Nascimento')).toHaveValue(/\d{2}\/\d{2}\/\d{4}/);

    // Marcar os termos
    await page.getByLabel('Aceito os termos e condições').check();
    await expect(page.getByLabel('Aceito os termos e condições')).toBeChecked();

    // Enviar o formulário
    await page.getByRole('button', { name: 'Enviar' }).click();
  });

  test('should show validation errors for required fields', async ({ page }) => {
    // Tentar enviar sem preencher
    await page.getByRole('button', { name: 'Enviar' }).click();

    // Verificar mensagens de erro
    await expect(page.getByText('Campo obrigatório')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Navegar pelos campos usando Tab
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Nome')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Estado')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Data de Nascimento')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Aceito os termos e condições')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Enviar' })).toBeFocused();
  });

  test('should handle error states correctly', async ({ page }) => {
    // Preencher email inválido
    await page.getByLabel('Email').fill('email-invalido');
    await page.getByLabel('Email').blur();
    
    // Verificar mensagem de erro
    await expect(page.getByText('Email inválido')).toBeVisible();
    await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  test('should be responsive', async ({ page }) => {
    // Testar em diferentes tamanhos de tela
    const sizes = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 768, height: 1024 },  // Tablet
      { width: 375, height: 667 }    // Mobile
    ];

    for (const size of sizes) {
      await page.setViewportSize(size);
      await expect(page.locator('form')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Enviar' })).toBeVisible();
    }
  });

  test('should handle loading states', async ({ page }) => {
    // Preencher o formulário
    await page.getByLabel('Nome').fill('João Silva');
    await page.getByLabel('Estado').selectOption('mg');
    await page.getByLabel('Aceito os termos e condições').check();

    // Simular submissão com loading
    await page.route('**/api/submit', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({ status: 200 });
    });

    // Enviar e verificar estado de loading
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page.getByText('Carregando...')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  });

  test('should handle dynamic form behavior', async ({ page }) => {
    // Testar comportamento condicional
    await page.getByLabel('Tipo de Pessoa').selectOption('juridica');
    await expect(page.getByLabel('CNPJ')).toBeVisible();

    await page.getByLabel('Tipo de Pessoa').selectOption('fisica');
    await expect(page.getByLabel('CPF')).toBeVisible();
  });

  test('should persist form data', async ({ page }) => {
    // Preencher dados
    await page.getByLabel('Nome').fill('João Silva');
    await page.getByLabel('Estado').selectOption('mg');

    // Simular refresh da página
    await page.reload();

    // Verificar se os dados persistiram
    await expect(page.getByLabel('Nome')).toHaveValue('João Silva');
    await expect(page.getByLabel('Estado')).toHaveValue('mg');
  });

  test('should handle file uploads', async ({ page }) => {
    // Criar arquivo temporário
    await page.setInputFiles('input[type="file"]', {
      name: 'test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test content'),
    });

    // Verificar se o arquivo foi carregado
    await expect(page.getByText('test.pdf')).toBeVisible();
  });
}); 