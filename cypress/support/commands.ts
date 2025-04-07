// Comandos para interagir com o Service Worker
Cypress.Commands.add('mockServiceWorkerUpdate', () => {
  return cy.window().then((win) => {
    // Simular evento de atualização disponível
    const event = new CustomEvent('swUpdateAvailable');
    win.dispatchEvent(event);
  });
});

Cypress.Commands.add('waitForServiceWorkerActivation', () => {
  return cy.window().then((win) => {
    return new Cypress.Promise((resolve) => {
      if (!('serviceWorker' in win.navigator)) {
        resolve(false);
        return;
      }

      const checkActivation = () => {
        win.navigator.serviceWorker.ready.then((registration) => {
          if (registration.active) {
            resolve(true);
          } else {
            setTimeout(checkActivation, 100);
          }
        });
      };

      checkActivation();
    });
  });
});

Cypress.Commands.add('checkResourceCached', (url: string) => {
  return cy.window().then((win) => {
    return new Cypress.Promise((resolve) => {
      if (!('caches' in win)) {
        resolve(false);
        return;
      }

      win.caches.open('app-cache-v1').then((cache) => {
        cache.match(url).then((response) => {
          resolve(!!response);
        });
      });
    });
  });
});

// Comando para simular diferentes condições de rede
Cypress.Commands.add('setNetworkCondition', (condition: string) => {
  return cy.window().then((win) => {
    switch (condition) {
      case 'offline':
        win.dispatchEvent(new Event('offline'));
        break;
      case 'online':
        win.dispatchEvent(new Event('online'));
        break;
      case 'slow-3g':
        // @ts-ignore - Usando API experimental do Chrome DevTools Protocol
        if (Cypress.automation) {
          Cypress.automation('remote:debugger:protocol', {
            command: 'Network.emulateNetworkConditions',
            params: {
              offline: false,
              latency: 2000,
              downloadThroughput: 500 * 1024 / 8,
              uploadThroughput: 500 * 1024 / 8
            }
          });
        }
        break;
      case 'fast-3g':
        // @ts-ignore - Usando API experimental do Chrome DevTools Protocol
        if (Cypress.automation) {
          Cypress.automation('remote:debugger:protocol', {
            command: 'Network.emulateNetworkConditions',
            params: {
              offline: false,
              latency: 500,
              downloadThroughput: 1.5 * 1024 * 1024 / 8,
              uploadThroughput: 750 * 1024 / 8
            }
          });
        }
        break;
      default:
        // Restaurar condições normais
        win.dispatchEvent(new Event('online'));
        // @ts-ignore - Usando API experimental do Chrome DevTools Protocol
        if (Cypress.automation) {
          Cypress.automation('remote:debugger:protocol', {
            command: 'Network.emulateNetworkConditions',
            params: {
              offline: false,
              latency: 0,
              downloadThroughput: -1,
              uploadThroughput: -1
            }
          });
        }
        break;
    }
  });
});

// Tipos para os comandos adicionais
declare global {
  namespace Cypress {
    interface Chainable {
      mockServiceWorkerUpdate(): Chainable<void>;
      waitForServiceWorkerActivation(): Chainable<boolean>;
      checkResourceCached(url: string): Chainable<boolean>;
      setNetworkCondition(condition: string): Chainable<void>;
    }
  }
} 