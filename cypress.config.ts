import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    setupNodeEvents(on, config) {
      // Configurar eventos do Node aqui
      on('task', {
        // Tarefas personalizadas do Cypress
        log(message) {
          console.log(message);
          return null;
        }
      });
    },
  },
  env: {
    // Variáveis de ambiente para testes
    coverage: false
  },
  retries: {
    runMode: 2,
    openMode: 0
  },
  viewportWidth: 1280,
  viewportHeight: 720,
  video: false,
  screenshotOnRunFailure: true
}); 