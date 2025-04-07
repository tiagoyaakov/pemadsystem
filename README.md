# PEMAD Material Check

Sistema de Conferência de Materiais do Pelotão de Emergências Ambientais e Respostas a Desastres (PEMAD) do Corpo de Bombeiros Militar de Minas Gerais.

## Funcionalidades

- Conferência de materiais diária
- Visualização de histórico de alterações
- Integração com dados de queimadas (NASA FIRMS)
- Mapa em tempo real
- Gráficos analíticos
- Compatibilidade com modo offline (PWA)
- Integração com WhatsApp (via Evolution API e n8n)

## Tecnologias

- Next.js (React + TypeScript)
- TailwindCSS
- Supabase (PostgreSQL, Auth, Storage)
- Leaflet.js
- IndexedDB + Workbox (PWA)
- n8n (automação)

## Pré-requisitos

- Node.js 18.x ou superior
- npm ou yarn
- Conta no Supabase
- Chave de API da NASA FIRMS
- (Opcional) Instância do n8n e Evolution API para integração com WhatsApp

## Configuração

1. Clone o repositório:

```bash
git clone [url-do-repositorio]
cd pemad-material-check-next
```

2. Instale as dependências:

```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env.local
```
Edite o arquivo .env.local com suas credenciais.

4. Execute o projeto em desenvolvimento:

```bash
npm run dev
# ou
yarn dev
```

## Estrutura do Projeto

```
/project
|-- /public          # Assets estáticos e arquivos do PWA
|-- /src
|   |-- /components  # Componentes React reutilizáveis
|   |-- /pages       # Páginas da aplicação
|   |-- /features    # Funcionalidades específicas
|   |-- /lib         # Utilitários e configurações
|   |-- /styles      # Estilos globais
|-- /scripts         # Scripts de automação
```

## Papéis e Permissões

- **Usuário**: Conferir materiais e visualizar histórico
- **Chefe**: Gerenciar materiais, editar conferências passadas
- **Comandante**: Gerenciar usuários, relatórios e configurações gerais

## Desenvolvimento

Para contribuir com o projeto:

1. Crie uma branch para sua feature
2. Faça commit das alterações
3. Abra um Pull Request

## Deploy

O projeto está configurado para deploy na Vercel, mas pode ser hospedado em qualquer plataforma que suporte Next.js.

```bash
npm run build
npm start
```

## Suporte Offline

O sistema funciona como um Progressive Web App (PWA), permitindo:

- Acesso offline aos dados previamente carregados
- Sincronização automática quando a conexão for restabelecida
- Cache inteligente de assets e respostas da API
- Notificações push para alertas e sincronizações
- Capacidade de gerenciar checklists e visualizar focos de incêndio mesmo sem conexão
- Interface de usuário adaptativa que indica o status de conectividade
- Fila de sincronização com persistência e retentativas automáticas
- Capacidade de instalação como aplicativo nativo em dispositivos móveis e desktop

Para instalar o aplicativo:
1. Acesse o site da aplicação em um navegador compatível
2. No Chrome/Edge: clique nos três pontos no canto superior direito e selecione "Instalar aplicativo"
3. No Safari (iOS): toque no ícone de compartilhamento e selecione "Adicionar à Tela de Início"

Para gerenciar a sincronização:
1. Observe o indicador de conectividade na barra de navegação
2. Clique no indicador para acessar a página de status de sincronização
3. Utilize o botão "Sincronizar Agora" quando estiver online para forçar a sincronização

## Geração de Assets para PWA

Para gerar os ícones e screenshots para o PWA:

```bash
# Primeiro, adicione uma imagem logo-base.png na pasta assets/
npm run generate-pwa-assets
```

## Service Worker

O service worker gerencia:
- Cache de recursos estáticos e dinâmicos
- Sincronização em segundo plano
- Notificações push
- Estratégias de cache conforme o tipo de recurso

Ele é gerado automaticamente durante o build utilizando o next-pwa.

## Licença

Este projeto é proprietário e de uso exclusivo do CBMMG.

## Contato

Para mais informações, entre em contato com a equipe do PEMAD.
