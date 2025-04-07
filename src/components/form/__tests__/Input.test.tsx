import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input', () => {
  it('renders correctly with default props', () => {
    render(<Input placeholder="Type here" />);
    
    const input = screen.getByPlaceholderText('Type here');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('block w-full rounded-md border-gray-300');
  });

  it('renders with label', () => {
    render(<Input label="Username" placeholder="Enter username" />);
    
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
  });

  it('renders with error message', () => {
    render(
      <Input 
        label="Password" 
        placeholder="Enter password" 
        error="Password is required" 
      />
    );
    
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter password')).toHaveClass('border-red-500');
  });

  it('handles user input', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(
      <Input 
        placeholder="Type here" 
        onChange={handleChange}
      />
    );
    
    const input = screen.getByPlaceholderText('Type here');
    await user.type(input, 'test');
    
    expect(handleChange).toHaveBeenCalledTimes(4); // One call per character
    expect(input).toHaveValue('test');
  });

  it('passes through additional props', () => {
    render(
      <Input 
        placeholder="Type here" 
        data-testid="test-input"
        maxLength={10}
        required
      />
    );
    
    const input = screen.getByPlaceholderText('Type here');
    expect(input).toHaveAttribute('data-testid', 'test-input');
    expect(input).toHaveAttribute('maxLength', '10');
    expect(input).toBeRequired();
  });

  it('applies custom className', () => {
    render(
      <Input 
        placeholder="Type here" 
        className="custom-class"
      />
    );
    
    expect(screen.getByPlaceholderText('Type here')).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = jest.fn();
    render(<Input ref={ref} placeholder="Type here" />);
    
    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLInputElement);
  });
}); 