# Histórico do projeto

Este arquivo registra fatos e marcos concluídos. O estado atual das tarefas fica
no [checklist executivo](../desenvolvimento/checklist-executivo.md); decisões
vigentes ficam no [escopo do MVP](../produto/escopo-mvp.md).

## Origem

O projeto começou como revisão da ata usada em um formulário Jotform. O recorte
inicial foi organizado em Informações Gerais e Participação. O formulário e suas
capturas foram preservados somente como
[referência visual](../referencias/formulario-legado/jotform.html).

## 21 de junho de 2026 — Modelo inicial

- Documentação e DBML harmonizados.
- Planilha estruturada com seis abas, cabeçalhos, filtros e validações.
- Dezessete grupos migrados para UUID.
- IDs anteriores preservados como `zoom_id`.
- Conta de serviço recebeu acesso de edição à planilha.

## 21 de junho de 2026 — Segurança

- Valores mínimos migrados para `.env.local`.
- JSONs de credenciais removidos.
- Regras do Git ampliadas para segredos e chaves.
- Cliente OAuth do n8n descartado.
- Rotação da chave da conta de serviço mantida como requisito pré-implantação.

## 21 de junho de 2026 — Fundação da aplicação

- Next.js App Router, React e TypeScript inicializados.
- Schemas e regras agregadas iniciais criados.
- Adaptador server-only com validação de cabeçalhos implementado.
- Auth.js configurado com Google e lista de e-mails.
- Login real validado.
- Painel autenticado leu os grupos ativos do Sheets.
- As seis abas tiveram seus cabeçalhos confirmados; somente `grupos` possuía
  registros.
- Testes iniciais, lint, TypeScript e build foram aprovados.

## 21 de junho de 2026 — Revisão do domínio

Foram fechadas as decisões de imutabilidade após envio, chave de duplicidade,
municípios brasileiros derivados do IBGE, enums adaptados ao Sheets, edição
manual configurável e planilha exclusiva de testes.

A revisão identificou a necessidade de completar mapeamentos, integridade
referencial, leitura agregada, escrita atômica e cobertura de testes antes do
formulário definitivo.

## 21 de junho de 2026 — Organização documental

A documentação passou a ser organizada por responsabilidade: produto,
arquitetura, desenvolvimento, projeto e referências. Nomes de arquivos foram
padronizados em ASCII `kebab-case` e `docs/README.md` tornou-se o índice
canônico.
