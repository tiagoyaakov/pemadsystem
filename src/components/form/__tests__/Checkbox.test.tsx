import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from '../Checkbox';

describe('Checkbox', () => {
  it('renders correctly with default props', () => {
    render(<Checkbox />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveClass('h-4 w-4 rounded border-gray-300 text-cbmmg-red');
  });

  it('renders with label', () => {
    render(<Checkbox label="Accept terms" />);
    
    expect(screen.getByText('Accept terms')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('renders with error message', () => {
    render(
      <Checkbox 
        label="Accept terms" 
        error="This field is required" 
      />
    );
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toHaveClass('border-red-500');
  });

  it('handles checkbox change', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(
      <Checkbox 
        label="Accept terms"
        onChange={handleChange}
      />
    );
    
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    expect(handleChange).toHaveBeenCalled();
    expect(checkbox).toBeChecked();
  });

  it('passes through additional props', () => {
    render(
      <Checkbox 
        data-testid="test-checkbox"
        required
        disabled
        checked
      />
    );
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('data-testid', 'test-checkbox');
    expect(checkbox).toBeRequired();
    expect(checkbox).toBeDisabled();
    expect(checkbox).toBeChecked();
  });

  it('applies custom className', () => {
    render(
      <Checkbox 
        className="custom-class"
      />
    );
    
    expect(screen.getByRole('checkbox')).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = jest.fn();
    render(<Checkbox ref={ref} />);
    
    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLInputElement);
  });

  it('maintains label association with checkbox', () => {
    render(<Checkbox label="Click me" />);
    
    const checkbox = screen.getByRole('checkbox');
    const label = screen.getByText('Click me');
    
    expect(label).toBeInTheDocument();
    expect(checkbox).toBeInTheDocument();
  });
}); 