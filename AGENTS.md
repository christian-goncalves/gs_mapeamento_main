# GS Mapeamento - instrucoes para agentes

## Fonte de verdade

- Ler `README.md` e `docs/README.md` antes de mudancas amplas.
- Usar os documentos canonicos indicados em `docs/README.md` para regras de
  produto, persistencia e execucao.
- Tratar o Google Sheets como persistencia oficial. Nao criar uma segunda fonte
  de verdade para dados de negocio.
- Preservar alteracoes existentes no worktree e limitar o diff ao pedido atual.

## Skill obrigatoria para atas

Usar `.agents/skills/gs-mapeamento-atas/SKILL.md` ao alterar:

- formulario de criacao ou visualizacao de atas;
- schemas, contratos, adaptadores ou escrita das abas `atas` e `servidores`;
- autocompletes e cache de sugestoes de nomes;
- validacoes, dropdowns, protecoes ou reconciliacao do Google Sheets.

## Contrato essencial dos campos

- `atas.preenchido_por` e `servidores.nome` sao textos livres com sugestoes
  opcionais por grupo. Nunca selecionar uma sugestao automaticamente.
- `atas.duracao` e `atas.formato_outros` sao textos livres e nao recebem
  dropdown no Sheets.
- Autocomplete da aplicacao nao transforma uma coluna em enum ou dropdown no
  Sheets.
- `atas.plataforma`, `atas.tipo_reuniao` e os enums documentados permanecem
  controlados.
- `visitantes.descricao` e `visitantes.como_chegou_a_na` sao campos controlados;
  `visitantes.nome` e gerado como `visitante_N` pelo backend.
- Ingressos so podem ser enviados quando houver ao menos um visitante na ata.
- Preservar payloads, validacoes de backend, registros historicos e relacoes por
  UUID.

## Fluxo de trabalho

1. Revisar `git status`, o diff atual e os arquivos proprietarios do
   comportamento.
2. Identificar separadamente o controle da interface, o schema de dominio, a
   serializacao e a validacao aplicada ao Sheets.
3. Implementar a menor alteracao coerente com os contratos existentes.
4. Adicionar ou atualizar testes direcionados.
5. Executar `npm run test`, `npm run lint` e `npm run build`.
6. Se o build alterar `next-env.d.ts`, restaurar somente esse efeito colateral.

## Operacoes no Google Sheets

- Nao executar scripts contra a planilha real sem informar antes o impacto e
  obter autorizacao explicita.
- `npm run sheets:reconcile-contract` pode criar colunas, migrar dados e
  reconciliar validacoes; revisar o diff e os testes antes de executa-lo.
- `npm run sheets:reconcile-protections` altera protecoes das abas e depende de
  `MANUAL_SHEETS_EDIT_ENABLED`.
- Usar planilha exclusiva para testes de escrita. Nunca usar producao como
  fixture de teste.
