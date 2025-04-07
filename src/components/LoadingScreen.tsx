import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  fullScreen?: boolean;
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  fullScreen = true,
  message = 'Carregando...'
}) => {
  const containerClass = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClass}>
      <div className="text-center">
        <Loader2 className="h-12 w-12 mx-auto text-red-500 animate-spin" />
        {message && (
          <p className="mt-4 text-lg font-medium text-gray-800">{message}</p>
        )}
        <div className="mt-2 flex justify-center">
          <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 animate-progress-bar"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 