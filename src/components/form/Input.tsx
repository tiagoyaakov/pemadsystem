import React from 'react';
import { useMetrics } from '../../hooks/useMetrics';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  className = '',
  onChange,
  onBlur,
  onFocus,
  ...props
}, ref) => {
  const { trackInteraction, trackFormError } = useMetrics({
    componentName: 'Input',
    trackInteractions: true
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const interaction = trackInteraction('change');
    
    if (onChange) {
      onChange(event);
    }

    // Validar valor se necessário
    if (props.type === 'email' && event.target.value && !event.target.value.includes('@')) {
      trackFormError('email', 'invalid', event.target.value);
    }
    
    interaction?.end();
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const interaction = trackInteraction('blur');
    
    if (onBlur) {
      onBlur(event);
    }
    
    // Validar campo vazio
    if (props.required && !event.target.value) {
      trackFormError(props.name || 'unknown', 'required', '');
    }
    
    interaction?.end();
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    const interaction = trackInteraction('focus');
    
    if (onFocus) {
      onFocus(event);
    }
    
    interaction?.end();
  };

  const baseClasses = 'block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm';
  const errorClasses = error ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' : '';
  
  const classes = [
    baseClasses,
    errorClasses,
    className
  ].join(' ');

  return (
    <div>
      <label
        htmlFor={props.id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      
      <div className="mt-1">
        <input
          ref={ref}
          className={classes}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
      </div>

      {error && (
        <p
          className="mt-2 text-sm text-red-600"
          id={`${props.id}-error`}
        >
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
}); 