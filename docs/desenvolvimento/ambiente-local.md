# Ambiente local

## Requisitos

- Node.js 24 ou versão LTS compatível com Next.js 16.
- Acesso da conta de serviço à planilha do MVP.
- Cliente OAuth Google do tipo Aplicativo da Web.

## Instalação

```bash
npm install
npm test
npm run dev
```

A aplicação fica disponível em `http://localhost:3000`.

## Variáveis de ambiente

O contrato sem valores está em [`.env.example`](../../.env.example). Valores
locais ficam em `.env.local`, ignorado pelo Git.

| Variável | Finalidade |
| --- | --- |
| `AUTH_SECRET` | Assinatura e proteção da sessão |
| `AUTH_GOOGLE_ID` | ID do cliente OAuth da aplicação |
| `AUTH_GOOGLE_SECRET` | Segredo do cliente OAuth |
| `AUTH_ALLOWED_EMAILS` | E-mails autorizados separados por vírgula |
| `GOOGLE_SHEETS_ID` | Planilha oficial |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Conta de serviço do backend |
| `GOOGLE_PRIVATE_KEY` | Chave privada da conta de serviço |
| `MANUAL_SHEETS_EDIT_ENABLED` | Política declarada de edição manual |

Nenhuma variável de segredo pode usar o prefixo `NEXT_PUBLIC_`.

## Reconciliação estrutural do contrato

`GOOGLE_SHEETS_ID` pode continuar apontando para a planilha oficial em
`.env.local`. Para validar ou aplicar mudanças estruturais do contrato, use
sobrescrita segura no comando e execute primeiro em DEV:

```bash
GOOGLE_SHEETS_ID=1oHQ_VgwlRHEEUZP5gXyUX8RiGz0hEEZebHUhXiy1imU npm run sheets:reconcile-contract
GOOGLE_SHEETS_ID=1itgYTa7CCWgjdux_Pt1ffNAxoNA8zTn9GTzsShH_1Yw npm run sheets:reconcile-contract
```

A rotina `sheets:reconcile-contract` cria abas ausentes e adiciona colunas
faltantes do contrato estrutural. IDs de planilhas e segredos continuam fora do
repositório; valores sensíveis devem ficar somente no ambiente local ou no
provedor de execução.

## Proteções do Sheets

`MANUAL_SHEETS_EDIT_ENABLED` aceita estritamente `true` ou `false`. Depois de
configurá-la, a política pode ser reconciliada por uma rotina administrativa:

```bash
npm run sheets:reconcile-protections
```

Com `true`, a rotina remove somente as proteções gerenciadas pela aplicação.
Com `false`, mantém uma proteção gerenciada em cada uma das sete abas, com a
conta de serviço autorizada a escrever. Proteções manuais são preservadas e o
proprietário da planilha continua capaz de administrar ou remover proteções.

## OAuth Google

Origem JavaScript local:

```text
http://localhost:3000
```

URI de redirecionamento local:

```text
http://localhost:3000/api/auth/callback/google
```

Na produção, devem ser cadastrados a origem HTTPS definitiva e o callback
equivalente. O cliente OAuth antigo do n8n não pode ser reutilizado.

## Segurança

- JSONs de credenciais não permanecem no projeto.
- `.env.local` nunca é versionado.
- A planilha deve ser compartilhada somente com administradores necessários e
  com a conta de serviço.
- A chave da conta de serviço deve ser rotacionada antes da implantação.
- Segredos devem ser configurados também nas variáveis de ambiente da Vercel.
