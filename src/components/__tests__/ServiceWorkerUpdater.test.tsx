import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ServiceWorkerUpdater } from '../ServiceWorkerUpdater';
import { useServiceWorker } from '../../hooks/useServiceWorker';
import { metricsService } from '../../services/metrics.service';

jest.mock('../../hooks/useServiceWorker');
jest.mock('../../services/metrics.service', () => ({
  metricsService: {
    recordMetric: jest.fn()
  }
}));

describe('ServiceWorkerUpdater', () => {
  const mockSkipWaiting = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.APP_VERSION = '1.0.0';
  });

  it('should not render when no update is available', () => {
    (useServiceWorker as jest.Mock).mockReturnValue({
      updateAvailable: false,
      waitingWorker: null,
      error: null,
      skipWaiting: mockSkipWaiting
    });

    render(<ServiceWorkerUpdater />);

    expect(screen.queryByText('Uma nova versão está disponível!')).not.toBeInTheDocument();
  });

  it('should not render when there is an error', () => {
    (useServiceWorker as jest.Mock).mockReturnValue({
      updateAvailable: true,
      waitingWorker: null,
      error: new Error('Test error'),
      skipWaiting: mockSkipWaiting
    });

    render(<ServiceWorkerUpdater />);

    expect(screen.queryByText('Uma nova versão está disponível!')).not.toBeInTheDocument();
  });

  it('should render update notification when update is available', () => {
    (useServiceWorker as jest.Mock).mockReturnValue({
      updateAvailable: true,
      waitingWorker: {},
      error: null,
      skipWaiting: mockSkipWaiting
    });

    render(<ServiceWorkerUpdater />);

    expect(screen.getByText('Uma nova versão está disponível!')).toBeInTheDocument();
    expect(screen.getByText('Atualizar agora')).toBeInTheDocument();
    expect(screen.getByText('Depois')).toBeInTheDocument();
  });

  it('should handle update when clicked', () => {
    const onUpdateComplete = jest.fn();
    (useServiceWorker as jest.Mock).mockReturnValue({
      updateAvailable: true,
      waitingWorker: {},
      error: null,
      skipWaiting: mockSkipWaiting
    });

    render(<ServiceWorkerUpdater onUpdateComplete={onUpdateComplete} />);

    fireEvent.click(screen.getByText('Atualizar agora'));

    expect(mockSkipWaiting).toHaveBeenCalled();
    expect(onUpdateComplete).toHaveBeenCalled();
    expect(metricsService.recordMetric).toHaveBeenCalledWith(
      'service_worker',
      'update_accepted',
      expect.objectContaining({
        version: '1.0.0'
      })
    );
  });

  it('should handle dismiss when clicked', () => {
    (useServiceWorker as jest.Mock).mockReturnValue({
      updateAvailable: true,
      waitingWorker: {},
      error: null,
      skipWaiting: mockSkipWaiting
    });

    render(<ServiceWorkerUpdater />);

    fireEvent.click(screen.getByText('Depois'));

    expect(metricsService.recordMetric).toHaveBeenCalledWith(
      'service_worker',
      'update_dismissed',
      expect.objectContaining({
        version: '1.0.0'
      })
    );
  });

  it('should record metric when update is available', () => {
    const onUpdate = jest.fn();
    let updateCallback: () => void = () => {};

    (useServiceWorker as jest.Mock).mockImplementation(({ onUpdate: callback }) => {
      updateCallback = callback;
      return {
        updateAvailable: true,
        waitingWorker: {},
        error: null,
        skipWaiting: mockSkipWaiting
      };
    });

    render(<ServiceWorkerUpdater />);

    // Simular callback de atualização
    updateCallback();

    expect(metricsService.recordMetric).toHaveBeenCalledWith(
      'service_worker',
      'update_notification',
      expect.objectContaining({
        shown: true
      })
    );
  });

  it('should record error metric when error occurs', () => {
    const error = new Error('Test error');
    let errorCallback: (error: Error) => void = () => {};

    (useServiceWorker as jest.Mock).mockImplementation(({ onError: callback }) => {
      errorCallback = callback;
      return {
        updateAvailable: false,
        waitingWorker: null,
        error: null,
        skipWaiting: mockSkipWaiting
      };
    });

    render(<ServiceWorkerUpdater />);

    // Simular callback de erro
    errorCallback(error);

    expect(metricsService.recordMetric).toHaveBeenCalledWith(
      'error',
      'sw_update',
      expect.objectContaining({
        message: 'Test error'
      })
    );
  });
}); 