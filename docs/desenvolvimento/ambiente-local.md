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
| `GOOGLE_SHEETS_TEST_ID` | Planilha exclusiva de testes |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Conta de serviço do backend |
| `GOOGLE_PRIVATE_KEY` | Chave privada da conta de serviço |
| `MANUAL_SHEETS_EDIT_ENABLED` | Política declarada de edição manual |

Nenhuma variável de segredo pode usar o prefixo `NEXT_PUBLIC_`.

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
