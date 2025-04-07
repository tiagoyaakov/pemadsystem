import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '../Button';
import { Input } from '../Input';
import { Select } from '../Select';
import { Checkbox } from '../Checkbox';
import { DatePicker } from '../DatePicker';

expect.extend(toHaveNoViolations);

describe('Form Components Accessibility', () => {
  it('Button has no accessibility violations', async () => {
    const { container } = render(
      <Button>Click me</Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Input has no accessibility violations', async () => {
    const { container } = render(
      <Input
        label="Username"
        placeholder="Enter username"
        required
        aria-describedby="username-hint"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Select has no accessibility violations', async () => {
    const { container } = render(
      <Select
        label="Country"
        options={[
          { value: 'br', label: 'Brasil' },
          { value: 'us', label: 'Estados Unidos' },
        ]}
        required
        aria-describedby="country-hint"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Checkbox has no accessibility violations', async () => {
    const { container } = render(
      <Checkbox
        label="Accept terms"
        required
        aria-describedby="terms-hint"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('DatePicker has no accessibility violations', async () => {
    const { container } = render(
      <DatePicker
        label="Birth date"
        aria-describedby="date-hint"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Complete form has no accessibility violations', async () => {
    const { container } = render(
      <form aria-label="Registration form">
        <div className="space-y-4">
          <Input
            label="Full name"
            name="name"
            required
            aria-describedby="name-hint"
          />
          <Select
            label="State"
            name="state"
            options={[
              { value: 'mg', label: 'Minas Gerais' },
              { value: 'sp', label: 'São Paulo' },
            ]}
            required
            aria-describedby="state-hint"
          />
          <DatePicker
            label="Birth date"
            name="birthDate"
            aria-describedby="birth-date-hint"
          />
          <Checkbox
            label="I agree to the terms"
            name="terms"
            required
            aria-describedby="terms-hint"
          />
          <Button type="submit">Submit</Button>
        </div>
      </form>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Form with error states has no accessibility violations', async () => {
    const { container } = render(
      <form aria-label="Registration form with errors">
        <div className="space-y-4">
          <Input
            label="Email"
            name="email"
            error="Invalid email format"
            aria-invalid="true"
            aria-errormessage="email-error"
          />
          <Select
            label="Country"
            name="country"
            options={[
              { value: 'br', label: 'Brasil' },
              { value: 'us', label: 'Estados Unidos' },
            ]}
            error="Please select a country"
            aria-invalid="true"
            aria-errormessage="country-error"
          />
          <Button type="submit" disabled>Submit</Button>
        </div>
      </form>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Form with dynamic content has no accessibility violations', async () => {
    const { container } = render(
      <form aria-label="Dynamic form">
        <div className="space-y-4" role="group" aria-labelledby="section-title">
          <h2 id="section-title">Personal Information</h2>
          <Input
            label="Name"
            name="name"
            required
            aria-describedby="name-hint"
          />
          <p id="name-hint" className="text-sm text-gray-500">
            Enter your full legal name
          </p>
          <div role="alert" aria-live="polite">
            {/* Simula uma mensagem dinâmica de validação */}
            <p className="text-red-500">Please fill in all required fields</p>
          </div>
        </div>
      </form>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
}); 