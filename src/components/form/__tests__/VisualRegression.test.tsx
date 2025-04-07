import { render } from '@testing-library/react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Select } from '../Select';
import { Checkbox } from '../Checkbox';
import { DatePicker } from '../DatePicker';

describe('Form Components Visual Regression', () => {
  it('Button matches snapshot in different states', () => {
    const { container: defaultButton } = render(<Button>Default</Button>);
    expect(defaultButton).toMatchSnapshot('button-default');

    const { container: secondaryButton } = render(<Button variant="secondary">Secondary</Button>);
    expect(secondaryButton).toMatchSnapshot('button-secondary');

    const { container: outlineButton } = render(<Button variant="outline">Outline</Button>);
    expect(outlineButton).toMatchSnapshot('button-outline');

    const { container: dangerButton } = render(<Button variant="danger">Danger</Button>);
    expect(dangerButton).toMatchSnapshot('button-danger');

    const { container: loadingButton } = render(<Button isLoading>Loading</Button>);
    expect(loadingButton).toMatchSnapshot('button-loading');

    const { container: disabledButton } = render(<Button disabled>Disabled</Button>);
    expect(disabledButton).toMatchSnapshot('button-disabled');
  });

  it('Input matches snapshot in different states', () => {
    const { container: defaultInput } = render(
      <Input label="Default" placeholder="Type here" />
    );
    expect(defaultInput).toMatchSnapshot('input-default');

    const { container: errorInput } = render(
      <Input label="Error" error="Invalid input" placeholder="Type here" />
    );
    expect(errorInput).toMatchSnapshot('input-error');

    const { container: disabledInput } = render(
      <Input label="Disabled" disabled placeholder="Type here" />
    );
    expect(disabledInput).toMatchSnapshot('input-disabled');
  });

  it('Select matches snapshot in different states', () => {
    const options = [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' },
    ];

    const { container: defaultSelect } = render(
      <Select label="Default" options={options} />
    );
    expect(defaultSelect).toMatchSnapshot('select-default');

    const { container: errorSelect } = render(
      <Select label="Error" error="Please select an option" options={options} />
    );
    expect(errorSelect).toMatchSnapshot('select-error');

    const { container: disabledSelect } = render(
      <Select label="Disabled" disabled options={options} />
    );
    expect(disabledSelect).toMatchSnapshot('select-disabled');
  });

  it('Checkbox matches snapshot in different states', () => {
    const { container: defaultCheckbox } = render(
      <Checkbox label="Default" />
    );
    expect(defaultCheckbox).toMatchSnapshot('checkbox-default');

    const { container: checkedCheckbox } = render(
      <Checkbox label="Checked" checked />
    );
    expect(checkedCheckbox).toMatchSnapshot('checkbox-checked');

    const { container: errorCheckbox } = render(
      <Checkbox label="Error" error="This field is required" />
    );
    expect(errorCheckbox).toMatchSnapshot('checkbox-error');

    const { container: disabledCheckbox } = render(
      <Checkbox label="Disabled" disabled />
    );
    expect(disabledCheckbox).toMatchSnapshot('checkbox-disabled');
  });

  it('DatePicker matches snapshot in different states', () => {
    const { container: defaultDatePicker } = render(
      <DatePicker label="Default" />
    );
    expect(defaultDatePicker).toMatchSnapshot('datepicker-default');

    const { container: withValueDatePicker } = render(
      <DatePicker label="With Value" value={new Date('2024-01-15')} />
    );
    expect(withValueDatePicker).toMatchSnapshot('datepicker-with-value');

    const { container: errorDatePicker } = render(
      <DatePicker label="Error" error="Please select a date" />
    );
    expect(errorDatePicker).toMatchSnapshot('datepicker-error');

    const { container: disabledDatePicker } = render(
      <DatePicker label="Disabled" disabled />
    );
    expect(disabledDatePicker).toMatchSnapshot('datepicker-disabled');
  });

  it('Complete form matches snapshot', () => {
    const { container } = render(
      <form className="space-y-4">
        <Input
          label="Name"
          name="name"
          required
          placeholder="Enter your name"
        />
        <Select
          label="Country"
          name="country"
          options={[
            { value: 'br', label: 'Brasil' },
            { value: 'us', label: 'Estados Unidos' },
          ]}
          required
        />
        <DatePicker
          label="Birth Date"
          name="birthDate"
        />
        <Checkbox
          label="I agree to the terms"
          name="terms"
          required
        />
        <Button type="submit">Submit</Button>
      </form>
    );
    expect(container).toMatchSnapshot('complete-form');
  });
}); 