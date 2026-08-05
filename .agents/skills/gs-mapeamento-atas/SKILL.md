---
name: gs-mapeamento-atas
description: Preserva os contratos do formulario de atas e da persistencia Google Sheets no GS Mapeamento. Use ao alterar campos de `/atas/nova` ou `/preencher/{token}`, schemas e adaptadores de atas/servidores, autocomplete de nomes por grupo, cache `ata-name-suggestions.json`, reconciliacao de colunas, validacoes, dropdowns ou protecoes das abas `atas` e `servidores`.
---

# GS Mapeamento - Atas

## Preparar a mudanca

1. Ler `GEMINI.md`, `docs/desenvolvimento/diretrizes-agentes.md`, `README.md` e o documento canonico relacionado em
   `docs/README.md`.
2. Revisar `git status` e o diff para preservar trabalho ja iniciado.
3. Localizar as quatro camadas do campo: componente React, schema de formulario,
   adaptador Sheets e reconciliador do contrato.
4. Consultar `references/ata-field-contract.md` para classificar o campo antes de
   criar ou remover uma validacao.

## Preservar texto livre e autocomplete

- Manter `preenchido_por` e `servidores.nome` como `input` de texto aberto.
- Exibir sugestoes sem preencher ou selecionar automaticamente.
- Filtrar sugestoes por prefixo desde a primeira letra, ignorando caixa e
  acentos.
- Permitir valores novos que nao estejam no cache.
- Carregar sugestoes pelo `grupo_id` atual, inclusive no formulario publico com
  grupo fixo.
- Atualizar o cache somente depois da gravacao bem-sucedida da ata.
- Normalizar com `trim`, remocao de vazios, deduplicacao sem diferenciar caixa ou
  acento e ordenacao `pt-BR`.
- Nao consultar todas as atas a cada digitacao.
- Nao converter o autocomplete em enum nem aplicar dropdown a coluna no Sheets.

## Reconciliar o Sheets

- Aplicar validacao de lista apenas aos campos controlados no contrato.
- Limpar explicitamente `dataValidation` de colunas textuais que possam ter
  herdado validacoes durante insercoes de colunas.
- Manter a limpeza idempotente: executar novamente deve produzir o mesmo
  contrato sem alterar valores persistidos.
- Preservar cabecalhos, UUIDs, identificadores por grupo e linhas historicas.
- Testar as faixas por indice derivado de `SHEET_HEADERS`; evitar numeros de
  coluna duplicados no codigo.
- Informar o impacto e pedir autorizacao antes de executar reconciliacao na
  planilha real.

## Validar

1. Executar os testes direcionados dos arquivos alterados.
2. Executar `npm run test`.
3. Executar `npm run lint`.
4. Executar `npm run build`.
5. Restaurar apenas a alteracao automatica de `next-env.d.ts`, se ocorrer.
6. Relatar separadamente codigo preparado e mudanca realmente aplicada no
   Google Sheets.
