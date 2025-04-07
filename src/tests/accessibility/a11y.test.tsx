import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ServiceWorkerUpdater } from '../../components/ServiceWorkerUpdater';
import { ServiceWorkerMonitor } from '../../components/ServiceWorkerMonitor';

// Extender as expectativas do Jest para incluir verificações de acessibilidade
expect.extend(toHaveNoViolations);

// Mock dos hooks necessários
jest.mock('../../hooks/useServiceWorker', () => ({
  useServiceWorker: jest.fn().mockImplementation((props) => {
    if (props?.onUpdate) {
      setTimeout(() => props.onUpdate(), 0);
    }
    return {
      registration: { active: { state: 'activated' } },
      updateAvailable: true,
      waitingWorker: {},
      error: null,
      update: jest.fn(),
      skipWaiting: jest.fn()
    };
  })
}));

// Mock dos serviços necessários
jest.mock('../../services/metrics.service', () => ({
  metricsService: {
    recordMetric: jest.fn()
  }
}));

describe('Testes de Acessibilidade', () => {
  it('ServiceWorkerUpdater não deve ter violações de acessibilidade', async () => {
    const { container } = render(<ServiceWorkerUpdater />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ServiceWorkerMonitor não deve ter violações de acessibilidade', async () => {
    const { container } = render(<ServiceWorkerMonitor showDetails={true} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ServiceWorkerMonitor com estado de erro não deve ter violações de acessibilidade', async () => {
    // Sobrescrever o mock para simular um estado de erro
    jest.spyOn(require('../../hooks/useServiceWorker'), 'useServiceWorker').mockReturnValueOnce({
      registration: null,
      updateAvailable: false,
      waitingWorker: null,
      error: new Error('Teste de erro'),
      update: jest.fn(),
      skipWaiting: jest.fn()
    });

    const { container } = render(<ServiceWorkerMonitor />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // Testes para verificar contraste de cores e outros aspectos específicos
  it('Deve usar cores com contraste adequado', async () => {
    const { container } = render(<ServiceWorkerMonitor showDetails={true} />);
    
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
    
    expect(results).toHaveNoViolations();
  });

  // Teste para verificar a navegabilidade por teclado
  it('Botões devem ser acessíveis por teclado', async () => {
    const { container } = render(<ServiceWorkerUpdater />);
    
    const results = await axe(container, {
      rules: {
        'button-name': { enabled: true },
        'focusable-no-name': { enabled: true }
      }
    });
    
    expect(results).toHaveNoViolations();
  });
}); 