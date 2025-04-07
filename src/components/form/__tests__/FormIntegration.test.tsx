import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';
import { Input } from '../Input';
import { Select } from '../Select';
import { Checkbox } from '../Checkbox';
import { DatePicker } from '../DatePicker';

const TestForm = () => {
  return (
    <form data-testid="test-form">
      <div className="space-y-4">
        <Input
          label="Nome"
          name="name"
          placeholder="Digite seu nome"
          required
        />
        <Select
          label="Estado"
          name="state"
          options={[
            { value: 'mg', label: 'Minas Gerais' },
            { value: 'sp', label: 'São Paulo' },
            { value: 'rj', label: 'Rio de Janeiro' },
          ]}
          required
        />
        <DatePicker
          label="Data de Nascimento"
          name="birthDate"
        />
        <Checkbox
          label="Aceito os termos e condições"
          name="terms"
          required
        />
        <Button type="submit">Enviar</Button>
      </div>
    </form>
  );
};

describe('Form Integration', () => {
  it('renders all form components correctly', () => {
    render(<TestForm />);
    
    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByLabelText('Estado')).toBeInTheDocument();
    expect(screen.getByLabelText('Data de Nascimento')).toBeInTheDocument();
    expect(screen.getByLabelText('Aceito os termos e condições')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument();
  });

  it('handles form interactions correctly', async () => {
    const user = userEvent.setup();
    render(<TestForm />);

    // Preencher o nome
    const nameInput = screen.getByLabelText('Nome');
    await user.type(nameInput, 'João Silva');
    expect(nameInput).toHaveValue('João Silva');

    // Selecionar o estado
    const stateSelect = screen.getByLabelText('Estado');
    await user.selectOptions(stateSelect, 'mg');
    expect(stateSelect).toHaveValue('mg');

    // Selecionar a data
    const dateInput = screen.getByLabelText('Data de Nascimento');
    await user.click(dateInput);
    const dayButton = screen.getByRole('button', { name: /15/i });
    await user.click(dayButton);

    // Marcar os termos
    const termsCheckbox = screen.getByLabelText('Aceito os termos e condições');
    await user.click(termsCheckbox);
    expect(termsCheckbox).toBeChecked();
  });

  it('validates required fields', async () => {
    const handleSubmit = jest.fn((e) => e.preventDefault());
    const user = userEvent.setup();

    render(
      <form onSubmit={handleSubmit} data-testid="test-form">
        <Input
          label="Nome"
          name="name"
          required
        />
        <Button type="submit">Enviar</Button>
      </form>
    );

    // Tentar enviar sem preencher
    const submitButton = screen.getByRole('button', { name: 'Enviar' });
    await user.click(submitButton);

    // Verificar se o formulário não foi enviado
    expect(handleSubmit).not.toHaveBeenCalled();

    // Preencher o campo obrigatório
    await user.type(screen.getByLabelText('Nome'), 'João Silva');
    await user.click(submitButton);

    // Verificar se o formulário foi enviado
    expect(handleSubmit).toHaveBeenCalled();
  });

  it('maintains focus order', async () => {
    const user = userEvent.setup();
    render(<TestForm />);

    // Simular navegação por Tab
    await user.tab();
    expect(screen.getByLabelText('Nome')).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText('Estado')).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText('Data de Nascimento')).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText('Aceito os termos e condições')).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Enviar' })).toHaveFocus();
  });

  it('handles form reset', async () => {
    const user = userEvent.setup();
    render(
      <form data-testid="test-form">
        <Input
          label="Nome"
          name="name"
        />
        <Button type="reset">Limpar</Button>
      </form>
    );

    // Preencher o campo
    const input = screen.getByLabelText('Nome');
    await user.type(input, 'João Silva');
    expect(input).toHaveValue('João Silva');

    // Limpar o formulário
    const resetButton = screen.getByRole('button', { name: 'Limpar' });
    await user.click(resetButton);

    // Verificar se o campo foi limpo
    expect(input).toHaveValue('');
  });
}); 