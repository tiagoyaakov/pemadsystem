import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatePicker } from '../DatePicker';

describe('DatePicker', () => {
  const mockDate = new Date('2024-01-15');

  it('renders correctly with default props', () => {
    render(<DatePicker />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('block w-full rounded-md border-gray-300');
    expect(input).toHaveAttribute('readonly');
  });

  it('renders with label', () => {
    render(<DatePicker label="Select date" />);
    
    expect(screen.getByText('Select date')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with error message', () => {
    render(
      <DatePicker 
        label="Select date" 
        error="Date is required" 
      />
    );
    
    expect(screen.getByText('Date is required')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
  });

  it('displays formatted date value', () => {
    render(<DatePicker value={mockDate} />);
    
    expect(screen.getByRole('textbox')).toHaveValue('15/01/2024');
  });

  it('opens calendar on input click', async () => {
    const user = userEvent.setup();
    render(<DatePicker />);
    
    const input = screen.getByRole('textbox');
    await user.click(input);
    
    expect(screen.getByRole('grid')).toBeInTheDocument(); // Calendar grid
  });

  it('calls onChange when date is selected', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(<DatePicker onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    await user.click(input);
    
    // Encontrar e clicar em um dia específico (15)
    const dayButton = screen.getByRole('button', { name: /15/i });
    await user.click(dayButton);
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(
      <DatePicker 
        className="custom-class"
      />
    );
    
    expect(screen.getByRole('textbox')).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = jest.fn();
    render(<DatePicker ref={ref} />);
    
    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLInputElement);
  });

  it('closes calendar when date is selected', async () => {
    const user = userEvent.setup();
    render(<DatePicker />);
    
    // Abrir o calendário
    await user.click(screen.getByRole('textbox'));
    expect(screen.getByRole('grid')).toBeInTheDocument();
    
    // Selecionar uma data
    const dayButton = screen.getByRole('button', { name: /15/i });
    await user.click(dayButton);
    
    // Verificar se o calendário foi fechado
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  it('shows calendar icon', () => {
    render(<DatePicker />);
    
    // O ícone é renderizado como um SVG
    const calendarIcon = document.querySelector('svg');
    expect(calendarIcon).toBeInTheDocument();
    expect(calendarIcon).toHaveClass('text-gray-400');
  });
}); 