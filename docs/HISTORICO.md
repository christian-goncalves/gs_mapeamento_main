# Histórico e estado atual

Este documento registra o contexto recuperado no momento da criação do
repositório local. Ele reúne somente decisões confirmadas na documentação, na
planilha e no trabalho realizado em 21 de junho de 2026.

## Origem

O GS Mapeamento começou como uma revisão da ata de reunião usada como referência
no Jotform. O primeiro recorte foi organizado em Informações Gerais e
Participação, priorizando um MVP simples e manipulável manualmente.

O formulário antigo, sua captura HTML e as imagens em `docs/` foram mantidos
somente como referência visual. Jotform não faz parte da arquitetura operacional.

## Decisões consolidadas

- Aplicação web própria em Next.js App Router, hospedada na Vercel.
- Google Sheets como fonte oficial de dados do MVP.
- Sem banco de dados local.
- Regras de negócio e acesso ao Sheets somente pelo backend.
- Login Google com Auth.js e lista de e-mails autorizados.
- Criação, listagem, visualização e edição de atas.
- Exclusão de atas fora do MVP.
- Finanças, ingressos, partilhas, anexos e informações extras fora do MVP.

## Contrato de dados

O modelo foi normalizado em seis entidades, representadas por abas do Sheets:

1. `grupos`
2. `atas`
3. `servidores`
4. `participacao`
5. `visitantes`
6. `trocas_chaveiro`

Todas as relações de uma reunião usam `ata_id`. Totais calculáveis não são
persistidos nem preenchidos manualmente.

## Cadastro de grupos

A aba `grupos` foi migrada para separar identidade interna e referência externa:

- `grupo_id`: UUID único usado nos relacionamentos internos;
- `zoom_id`: identificador externo do Zoom, armazenado como texto e repetível;
- `grupo_nome`: nome de exibição;
- `ordem`: posição de exibição;
- `ativo`: disponibilidade no formulário;
- `created_at` e `updated_at`: auditoria.

Foram preservados 17 grupos. Cada grupo recebeu um UUID, os IDs anteriores foram
mantidos em `zoom_id` e a ordem foi preenchida de 1 a 17.

## Recursos atuais

- Planilha do MVP:
  https://docs.google.com/spreadsheets/d/1oHQ_VgwlRHEEUZP5gXyUX8RiGz0hEEZebHUhXiy1imU/edit
- Diagrama de dados:
  https://dbdiagram.io/d/6a37eb4e5c789b8acbcb38db
- Modelo versionável: `docs/modelo_dados.dbml`

## Estado no marco inicial

Concluído:

- contrato documental harmonizado;
- DBML criado;
- planilha estruturada com seis abas;
- cabeçalhos, filtros, validações e campos de auditoria configurados;
- grupos migrados para UUID e `zoom_id`;
- conta de serviço Google com acesso de edição à planilha.

Próxima etapa planejada:

1. definir os valores controlados de `plataforma`;
2. inicializar a aplicação Next.js;
3. configurar Auth.js e variáveis de ambiente;
4. implementar a camada de domínio e o adaptador server-only do Google Sheets;
5. construir criação, listagem, visualização e edição de atas.

## Segurança

As credenciais necessárias foram migradas dos JSONs de origem para
`.env.local`, ignorado pelo Git, e os JSONs foram removidos do projeto. O cliente
OAuth encontrado era específico do callback do n8n e não foi reaproveitado para
Auth.js. Antes da implantação, a chave da conta de serviço deve ser rotacionada
e os novos segredos devem ser configurados na Vercel, nunca no repositório.

## Fundação da aplicação - 21 de junho de 2026

Implementado:

- Next.js 16 com App Router, React 19 e TypeScript;
- schemas Zod e regras agregadas das seis entidades;
- indicadores derivados sem persistência;
- adaptador Google Sheets restrito ao servidor, com conferência estrita dos
  cabeçalhos;
- Auth.js com Google e autorização por `AUTH_ALLOWED_EMAILS` em cada leitura;
- página de login, grupos ativos ordenados e listagem de atas;
- testes unitários de domínio e conversão das linhas do Sheets.

Validação real da planilha:

- as seis abas possuem os cabeçalhos esperados;
- `grupos` contém 17 registros e foi lida com sucesso pela conta de serviço;
- as outras cinco abas ainda não possuem registros;
- grupos ativos são filtrados e ordenados pelo campo `ordem` no backend.

Bloqueio externo restante para testar o login Google de ponta a ponta:

- criar um cliente OAuth 2.0 do tipo Aplicativo da Web exclusivo da aplicação;
- cadastrar `http://localhost:3000/api/auth/callback/google` e o callback do
  domínio de produção;
- preencher `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` e
  `AUTH_ALLOWED_EMAILS` no ambiente local e na Vercel.

O OAuth antigo do n8n permanece explicitamente descartado. A rotação da chave
da conta de serviço continua obrigatória antes da implantação.
