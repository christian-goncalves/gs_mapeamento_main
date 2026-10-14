# Diagnóstico do ambiente local

## Objeto da investigação

Identificar o que falta para executar localmente o GS Mapeamento.

## Contexto

O projeto é um aplicativo Next.js que usa Google Sheets como persistência e Auth.js para autenticação. A consulta foi limitada ao estado local, aos requisitos documentados e à resposta HTTP da aplicação.

## Evidências examinadas

- `README.md` e `docs/desenvolvimento/ambiente-local.md`.
- `AGENTS.md` e `docs/desenvolvimento/diretrizes-agentes.md`.
- `package.json`, versão de Node requerida por `node_modules/next/package.json` e presença de `node_modules`.
- Nomes e estado preenchido/em branco das variáveis em `.env.local`, sem ler ou registrar seus valores.
- `src/lib/sheets/client.ts`, `src/auth.ts` e referências de variáveis no código.
- `git status --short` e resposta HTTP de `http://127.0.0.1:3000`.

## Estado observado

- Dependências instaladas (`node_modules` presente); Node `v22.23.3`, npm `10.9.9`. O Next instalado declara Node `>=20.9.0`.
- `.env.local` existe e tem preenchidas as variáveis essenciais identificadas para OAuth Google, autorização por e-mail e Google Sheets: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_ALLOWED_EMAILS`, `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL` e `GOOGLE_PRIVATE_KEY`. `APP_URL` também está preenchida.
- `RESEND_API_KEY` e `EMAIL_FROM` estão em branco; são exigidas pelos módulos de envio de e-mail.
- `GOOGLE_SHEETS_TEST_ID` e `GOOGLE_SHEETS_DEV_ID` estão em branco. O cliente normal usa `GOOGLE_SHEETS_ID`; `GOOGLE_SHEETS_DEV_ID` é exigida pela rotina de simulação mensal, não pela inicialização normal. `GOOGLE_SHEETS_TEST_ID` não tem uso encontrado no código atual.
- A porta local 3000 está escutando. A resposta HTTP é `307` com redirecionamento para `/login`, servida por Next.js.
- O diretório contém alterações preexistentes em `.env.example` e `.gitignore`; elas não foram modificadas nesta investigação.

## Análise

Os requisitos locais de instalação e configuração estão presentes. A resposta do Next.js confirma que o servidor está em execução e consegue atender a rota inicial, encaminhando a sessão não autenticada para o login. Isso não comprova que o fluxo OAuth termina com sucesso, nem que a aplicação consiga ler ou gravar na planilha.

Os campos de Resend vazios afetam os fluxos que enviam e-mail, mas não são requisito para iniciar o servidor, abrir a tela de login ou usar as funções principais que não enviam e-mail. As variáveis de teste/simulação também não são necessárias para a execução normal.

## Diagnóstico

Para iniciar e abrir o projeto localmente, não há dependência ou variável essencial faltando identificada. O servidor já responde em `http://127.0.0.1:3000` e redireciona para login. O funcionamento efetivo do login Google e do acesso à planilha ainda não foi confirmado por uma sessão autenticada.

## Grau de certeza

Alto quanto à instalação, presença das variáveis essenciais e resposta HTTP local; não comprovado quanto ao sucesso de OAuth e à conectividade/autorização real da API do Sheets.

## Pontos ainda não comprovados

- Conclusão do login Google usando uma conta autorizada.
- Leitura e escrita autorizadas na planilha DEV pela conta de serviço configurada.
- Envio de e-mails, pois as variáveis de Resend estão em branco.
