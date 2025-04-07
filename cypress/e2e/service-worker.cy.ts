/// <reference types="cypress" />

describe('Service Worker', () => {
  beforeEach(() => {
    // Limpar service workers e caches antes de cada teste
    cy.unregisterServiceWorkers();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    
    // Visitar a página inicial
    cy.visit('/');
  });

  it('should register and activate service worker', () => {
    cy.waitForServiceWorkerActivation().should('be.true');
  });

  it('should cache critical resources', () => {
    cy.waitForServiceWorkerActivation();
    
    // Verificar se recursos críticos foram cacheados
    cy.checkResourceCached('/index.html').should('be.true');
    cy.checkResourceCached('/static/js/main.bundle.js').should('be.true');
    cy.checkResourceCached('/static/css/main.css').should('be.true');
  });

  it('should show update notification when new version is available', () => {
    cy.waitForServiceWorkerActivation();
    
    // Simular atualização disponível
    cy.mockServiceWorkerUpdate();

    // Verificar se a notificação é exibida
    cy.contains('Uma nova versão está disponível!').should('be.visible');
    cy.contains('Atualizar agora').should('be.visible');
    cy.contains('Depois').should('be.visible');
  });

  it('should handle update acceptance', () => {
    cy.waitForServiceWorkerActivation();
    cy.mockServiceWorkerUpdate();

    // Clicar no botão de atualização
    cy.contains('Atualizar agora').click();

    // Verificar se a página foi recarregada
    cy.window().then((win) => {
      expect(win.location.reload).to.have.been.called;
    });
  });

  it('should handle update dismissal', () => {
    cy.waitForServiceWorkerActivation();
    cy.mockServiceWorkerUpdate();

    // Clicar no botão de dispensar
    cy.contains('Depois').click();

    // Verificar se a notificação foi removida
    cy.contains('Uma nova versão está disponível!').should('not.exist');
  });

  it('should handle offline mode', () => {
    cy.waitForServiceWorkerActivation();

    // Simular modo offline
    cy.window().then((win) => {
      win.dispatchEvent(new Event('offline'));
    });

    // Verificar se recursos cacheados ainda estão disponíveis
    cy.checkResourceCached('/index.html').should('be.true');
    cy.checkResourceCached('/static/css/main.css').should('be.true');

    // Tentar acessar um recurso não cacheado
    cy.request({
      url: '/api/test',
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(404);
    });

    // Restaurar modo online
    cy.window().then((win) => {
      win.dispatchEvent(new Event('online'));
    });
  });

  it('should preload resources based on priority', () => {
    cy.waitForServiceWorkerActivation();

    // Atualizar prioridade de um recurso
    const testUrl = '/test-resource.js';
    cy.window().then((win) => {
      win.postMessage({
        type: 'UPDATE_RESOURCE_PRIORITY',
        url: testUrl,
        priority: 0.9
      }, '*');
    });

    // Verificar se o recurso foi cacheado após atualização de prioridade
    cy.wait(1000); // Aguardar preload
    cy.checkResourceCached(testUrl).should('be.true');
  });

  it('should handle service worker errors gracefully', () => {
    cy.waitForServiceWorkerActivation();

    // Simular erro no service worker
    cy.window().then((win) => {
      win.dispatchEvent(new ErrorEvent('error', {
        message: 'Service Worker Error',
        filename: 'service-worker.js'
      }));
    });

    // Verificar se a aplicação continua funcionando
    cy.get('body').should('be.visible');
  });
}); 