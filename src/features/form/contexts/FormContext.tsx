import { createContext, useContext, useCallback } from 'react';
import { z } from 'zod';

interface FormContextData {
  validateField: (schema: z.ZodType<any>, value: any) => string | undefined;
  validateForm: <T>(schema: z.ZodType<T>, data: T) => Record<string, string> | undefined;
}

const FormContext = createContext<FormContextData>({} as FormContextData);

export function FormProvider({ children }: { children: React.ReactNode }) {
  const validateField = useCallback((schema: z.ZodType<any>, value: any) => {
    try {
      schema.parse(value);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0].message;
      }
      return 'Erro de validação';
    }
  }, []);

  const validateForm = useCallback(<T,>(schema: z.ZodType<T>, data: T) => {
    try {
      schema.parse(data);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors.reduce((acc, curr) => {
          const path = curr.path.join('.');
          return { ...acc, [path]: curr.message };
        }, {});
      }
      return { form: 'Erro de validação' };
    }
  }, []);

  return (
    <FormContext.Provider value={{ validateField, validateForm }}>
      {children}
    </FormContext.Provider>
  );
}

export function useForm() {
  const context = useContext(FormContext);

  if (!context) {
    throw new Error('useForm must be used within a FormProvider');
  }

  return context;
} 