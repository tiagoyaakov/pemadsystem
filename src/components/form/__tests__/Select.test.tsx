import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '../Select';

const mockOptions = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
];

describe('Select', () => {
  it('renders correctly with default props', () => {
    render(<Select options={mockOptions} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select).toHaveClass('block w-full rounded-md border-gray-300');
    
    mockOptions.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  it('renders with label', () => {
    render(<Select label="Select an option" options={mockOptions} />);
    
    expect(screen.getByText('Select an option')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders with error message', () => {
    render(
      <Select 
        label="Select an option" 
        options={mockOptions} 
        error="Selection is required" 
      />
    );
    
    expect(screen.getByText('Selection is required')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveClass('border-red-500');
  });

  it('handles selection change', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(
      <Select 
        options={mockOptions} 
        onChange={handleChange}
      />
    );
    
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, '2');
    
    expect(handleChange).toHaveBeenCalled();
    expect(select).toHaveValue('2');
  });

  it('passes through additional props', () => {
    render(
      <Select 
        options={mockOptions}
        data-testid="test-select"
        required
        disabled
      />
    );
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('data-testid', 'test-select');
    expect(select).toBeRequired();
    expect(select).toBeDisabled();
  });

  it('applies custom className', () => {
    render(
      <Select 
        options={mockOptions}
        className="custom-class"
      />
    );
    
    expect(screen.getByRole('combobox')).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = jest.fn();
    render(<Select ref={ref} options={mockOptions} />);
    
    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLSelectElement);
  });

  it('renders with numeric values', () => {
    const numericOptions = [
      { value: 1, label: 'One' },
      { value: 2, label: 'Two' },
    ];

    render(<Select options={numericOptions} />);
    
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
  });
}); 