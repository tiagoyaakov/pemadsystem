// Importar comandos do Cypress
import './commands';

// Desativar logs específicos do Cypress
const app = window.top;
if (app) {
  app.console.log = () => {};
}

// Comandos personalizados para Service Worker
Cypress.Commands.add('waitForServiceWorker', () => {
  return new Cypress.Promise((resolve) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(resolve);
    } else {
      resolve(null);
    }
  });
});

Cypress.Commands.add('unregisterServiceWorkers', () => {
  return new Cypress.Promise((resolve) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => {
          return Promise.all(
            registrations.map(registration => registration.unregister())
          );
        })
        .then(resolve);
    } else {
      resolve(null);
    }
  });
});

Cypress.Commands.add('checkCacheStorage', (cacheName: string) => {
  return new Cypress.Promise((resolve) => {
    if ('caches' in window) {
      caches.has(cacheName).then(resolve);
    } else {
      resolve(false);
    }
  });
});

// Tipos para os comandos personalizados
declare global {
  namespace Cypress {
    interface Chainable {
      waitForServiceWorker(): Chainable<ServiceWorkerRegistration | null>;
      unregisterServiceWorkers(): Chainable<boolean[]>;
      checkCacheStorage(cacheName: string): Chainable<boolean>;
    }
  }
} 