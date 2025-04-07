import React, { useState } from 'react';
import { useMetrics } from '../../hooks/useMetrics';
import { Button } from './Button';
import { Input } from './Input';

interface FormData {
  name: string;
  email: string;
  message: string;
}

interface FormProps {
  onSubmit: (data: FormData) => Promise<void>;
}

export const Form: React.FC<FormProps> = ({ onSubmit }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: ''
  });

  const { trackInteraction, trackFormError, trackNavigation } = useMetrics({
    componentName: 'ContactForm',
    trackInteractions: true,
    trackEngagement: true
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    let isValid = true;

    if (!formData.name) {
      newErrors.name = 'Nome é obrigatório';
      trackFormError('name', 'required', '');
      isValid = false;
    }

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
      trackFormError('email', 'required', '');
      isValid = false;
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Email inválido';
      trackFormError('email', 'invalid', formData.email);
      isValid = false;
    }

    if (!formData.message) {
      newErrors.message = 'Mensagem é obrigatória';
      trackFormError('message', 'required', '');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const interaction = trackInteraction(`input-change-${name}`);

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpar erro do campo quando usuário começa a digitar
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }

    interaction?.end();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const interaction = trackInteraction('form-submit');

    if (!validateForm()) {
      interaction?.end();
      return;
    }

    try {
      setIsLoading(true);
      const navigation = trackNavigation('form-submission');
      
      await onSubmit(formData);
      
      // Limpar formulário após sucesso
      setFormData({
        name: '',
        email: '',
        message: ''
      });
      
      navigation?.end();
    } catch (error) {
      trackFormError('submit', 'api-error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      interaction?.end();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        id="name"
        name="name"
        label="Nome"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        required
      />

      <Input
        id="email"
        name="email"
        type="email"
        label="Email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        required
      />

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-gray-700"
        >
          Mensagem
        </label>
        <div className="mt-1">
          <textarea
            id="message"
            name="message"
            rows={4}
            value={formData.message}
            onChange={handleChange}
            className={`
              block w-full rounded-md shadow-sm sm:text-sm
              ${errors.message
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }
            `}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'message-error' : undefined}
            required
          />
        </div>
        {errors.message && (
          <p
            className="mt-2 text-sm text-red-600"
            id="message-error"
          >
            {errors.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        isLoading={isLoading}
        fullWidth
      >
        Enviar mensagem
      </Button>
    </form>
  );
}; 