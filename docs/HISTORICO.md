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

Os JSONs de credenciais Google permanecem somente no ambiente local e são
ignorados pelo Git. Antes da implantação, as chaves devem ser rotacionadas e os
segredos devem ser configurados no ambiente local e na Vercel, nunca no
repositório.
