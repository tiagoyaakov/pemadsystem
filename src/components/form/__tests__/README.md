# Testes dos Componentes de Formulário

Este diretório contém os testes unitários, de integração, de acessibilidade e de regressão visual para os componentes de formulário do projeto.

## Estrutura

```
__tests__/
  ├── Accessibility.test.tsx
  ├── Button.test.tsx
  ├── Checkbox.test.tsx
  ├── DatePicker.test.tsx
  ├── FormIntegration.test.tsx
  ├── Input.test.tsx
  ├── Select.test.tsx
  ├── VisualRegression.test.tsx
  └── README.md
```

## Tipos de Testes

### 1. Testes Unitários

Cada componente tem seus testes unitários que verificam:

- Renderização com props padrão
- Renderização com diferentes variantes/estados
- Manipulação de eventos
- Acessibilidade básica
- Passagem de refs e props customizadas
- Estados de erro e validação

### 2. Testes de Integração

O arquivo `FormIntegration.test.tsx` demonstra como os componentes funcionam juntos em um formulário:

- Renderização do formulário completo
- Interações do usuário
- Validação de campos obrigatórios
- Ordem de foco (tab order)
- Reset do formulário

### 3. Testes de Acessibilidade

O arquivo `Accessibility.test.tsx` utiliza axe-core para testar:

- Conformidade com WCAG 2.1
- Roles e atributos ARIA
- Estados de erro acessíveis
- Navegação por teclado
- Mensagens dinâmicas
- Formulários complexos

### 4. Testes de Regressão Visual

O arquivo `VisualRegression.test.tsx` mantém snapshots para:

- Diferentes estados dos componentes
- Variantes visuais
- Estados de erro
- Formulários completos
- Responsividade

## Boas Práticas

### Testes Unitários e de Integração
- Use roles e labels para queries de elementos
- Prefira `userEvent` sobre `fireEvent` para simular interações
- Mantenha os testes focados e descritivos
- Use mocks com moderação

### Testes de Acessibilidade
- Teste todos os estados do componente
- Verifique mensagens de erro e descrições
- Teste navegação por teclado
- Valide atributos ARIA
- Verifique contraste e legibilidade

### Testes de Snapshot
- Mantenha snapshots pequenos e focados
- Atualize snapshots com cautela
- Documente mudanças visuais
- Use nomes descritivos

## Cobertura de Testes

O projeto tem uma meta de cobertura de 80% para:

- Branches
- Functions
- Lines
- Statements

## Scripts Disponíveis

```bash
# Rodar todos os testes
npm test

# Rodar testes em modo watch
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage

# Atualizar snapshots
npm test -- -u
```

## Bibliotecas Utilizadas

- Jest
- Testing Library
- user-event
- jest-axe
- @axe-core/react

## Exemplos

### Teste de Acessibilidade

```typescript
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

it('has no accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Teste de Snapshot

```typescript
it('matches visual snapshot', () => {
  const { container } = render(<Button variant="primary">Click me</Button>);
  expect(container).toMatchSnapshot();
});
```

## Contribuindo

Ao adicionar novos componentes:

1. Crie os arquivos de teste necessários
2. Implemente testes unitários
3. Adicione testes de acessibilidade
4. Crie snapshots visuais
5. Atualize esta documentação

## Troubleshooting

### Problemas Comuns

1. Testes assíncronos falhando
   - Use `await` com interações de usuário
   - Verifique se está usando `async/await` corretamente

2. Elementos não encontrados
   - Verifique se está usando a query correta
   - Confirme se o elemento está realmente no DOM
   - Use `screen.debug()` para depurar

3. Erros de snapshot
   - Atualize os snapshots se as mudanças forem intencionais
   - Verifique se as mudanças são esperadas

4. Falhas de acessibilidade
   - Verifique os atributos ARIA
   - Confirme a estrutura semântica
   - Valide contrastes de cor
   - Teste com diferentes leitores de tela 