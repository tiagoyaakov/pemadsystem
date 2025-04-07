import React, { useEffect, useRef } from 'react';
import { useMetrics } from '../../hooks/useMetrics';

interface ImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'loading'> {
  src: string;
  alt: string;
  lazy?: boolean;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export const Image: React.FC<ImageProps> = ({
  src,
  alt,
  lazy = true,
  priority = false,
  className = '',
  onLoad,
  onError,
  ...props
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const loadStartTime = useRef<number>(0);

  const { trackInteraction } = useMetrics({
    componentName: 'Image',
    trackInteractions: true
  });

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && imgRef.current) {
            loadStartTime.current = performance.now();
            imgRef.current.src = src;
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px'
      }
    );

    if (lazy && !priority) {
      observer.observe(imgRef.current);
    } else {
      loadStartTime.current = performance.now();
      imgRef.current.src = src;
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, lazy, priority]);

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const interaction = trackInteraction('image-load');
    
    const loadTime = performance.now() - loadStartTime.current;
    const imageSize = event.currentTarget.naturalWidth * event.currentTarget.naturalHeight;
    
    // Registrar métricas de carregamento
    interaction?.end();
    
    // Registrar métricas adicionais
    if (window.performance && window.performance.getEntriesByName) {
      const resourceTiming = window.performance.getEntriesByName(src)[0] as PerformanceResourceTiming;
      if (resourceTiming) {
        const metrics = {
          loadTime,
          imageSize,
          transferSize: resourceTiming.transferSize,
          encodedBodySize: resourceTiming.encodedBodySize,
          decodedBodySize: resourceTiming.decodedBodySize
        };
        
        console.debug('Image metrics:', metrics);
      }
    }

    onLoad?.();
  };

  const handleError = () => {
    const interaction = trackInteraction('image-error');
    console.error(`Failed to load image: ${src}`);
    interaction?.end();
    onError?.();
  };

  return (
    <img
      ref={imgRef}
      alt={alt}
      className={`transition-opacity duration-300 ${className}`}
      loading={lazy && !priority ? 'lazy' : 'eager'}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
}; 