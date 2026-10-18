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
| `GOOGLE_SHEETS_ID` | Planilha do ambiente atual |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Conta de serviço do backend |
| `GOOGLE_PRIVATE_KEY` | Chave privada da conta de serviço |
| `MANUAL_SHEETS_EDIT_ENABLED` | Política declarada de edição manual |

Nenhuma variável de segredo pode usar o prefixo `NEXT_PUBLIC_`.

## Ambientes Dev e Prod

O projeto usa somente a variável `GOOGLE_SHEETS_ID`. O nome é igual em todos
os ambientes; o valor depende do ambiente:

- `.env.local`: planilha Dev.
- Vercel Preview e Development: planilha Dev.
- Vercel Production: planilha Prod.

Cada ambiente lê e escreve na planilha indicada pelo seu próprio valor. Antes
de executar localmente qualquer rotina que altere dados ou estrutura, confirme
que `.env.local` seleciona a planilha Dev. IDs e segredos ficam fora do
repositório, no ambiente local ou no provedor de execução.

## Reconciliação estrutural do contrato

A rotina `sheets:reconcile-contract` cria abas ausentes e adiciona colunas
faltantes do contrato estrutural. Execute-a localmente somente depois de
confirmar que `GOOGLE_SHEETS_ID` em `.env.local` aponta para Dev.

## Proteções do Sheets

`MANUAL_SHEETS_EDIT_ENABLED` aceita estritamente `true` ou `false`. Depois de
configurá-la, a política pode ser reconciliada por uma rotina administrativa:

```bash
npm run sheets:reconcile-protections
```

Com `true`, a rotina remove somente as proteções gerenciadas pela aplicação.
Com `false`, mantém uma proteção gerenciada em cada aba do contrato, com a
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
