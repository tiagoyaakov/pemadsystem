import { forwardRef, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import { HiCalendar } from 'react-icons/hi';
import 'react-day-picker/dist/style.css';

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label?: string;
  error?: string;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, value, onChange, className = '', ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              ref={ref}
              className={`
                block w-full rounded-md border-gray-300 shadow-sm pr-10
                focus:border-cbmmg-red focus:ring-cbmmg-red sm:text-sm
                ${error ? 'border-red-500' : ''}
                ${className}
              `}
              value={value ? format(value, 'dd/MM/yyyy') : ''}
              readOnly
              onClick={() => setIsOpen(true)}
              {...props}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <HiCalendar className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          {isOpen && (
            <div className="absolute z-10 mt-1">
              <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
                <DayPicker
                  mode="single"
                  selected={value}
                  onSelect={(date) => {
                    onChange?.(date);
                    setIsOpen(false);
                  }}
                  locale={ptBR}
                  className="!font-sans"
                  classNames={{
                    day_selected: '!bg-cbmmg-red !text-white',
                    day_today: '!text-cbmmg-red',
                  }}
                />
              </div>
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
); 