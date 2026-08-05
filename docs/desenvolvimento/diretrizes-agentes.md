# GS Mapeamento - Diretrizes Gerais para Agentes de IA

Este arquivo contém as diretrizes técnicas, contratos de dados e fluxos de desenvolvimento do projeto **GS Mapeamento**. Estas diretrizes devem ser seguidas rigorosamente por todos os agentes de IA (**Gemini**, **Codex** e outros).

---

## Idioma e Comunicação

- Responda sempre em português do Brasil.
- Toda a comunicação com o usuário deve ser em português, incluindo análises, planos, perguntas, mensagens de confirmação, explicações técnicas, documentação e comentários em código quando solicitados.
- Utilize inglês apenas quando o código exigir (como nomes de variáveis, APIs, bibliotecas, comandos, logs ou identificadores de erro) ou se solicitado explicitamente.
- Nunca alterne automaticamente para inglês durante a conversa.

---

## Fonte de Verdade

- Ler [README.md](file:///home/cg/Documentos/01-DEV/PROJETOS/Apps/02-GS_Mapeamento/README.md) e [docs/README.md](file:///home/cg/Documentos/01-DEV/PROJETOS/Apps/02-GS_Mapeamento/docs/README.md) antes de mudanças amplas.
- Usar os documentos canônicos indicados em [docs/README.md](file:///home/cg/Documentos/01-DEV/PROJETOS/Apps/02-GS_Mapeamento/docs/README.md) para regras de produto, persistência e execução.
- Tratar o Google Sheets como persistência oficial. Não criar uma segunda fonte de verdade para dados de negócio.
- Preservar alterações existentes no worktree e limitar o diff ao pedido atual.

---

## Contrato Essencial dos Campos

- `atas.preenchido_por` e `servidores.nome` são textos livres com sugestões opcionais por grupo. Nunca selecionar uma sugestão automaticamente.
- `atas.duracao` e `atas.formato_outros` são textos livres e não recebem dropdown no Sheets.
- Autocomplete da aplicação não transforma uma coluna em enum ou dropdown no Sheets.
- `atas.plataforma`, `atas.tipo_reuniao` e os enums documentados permanecem controlados.
- `visitantes.descricao` e `visitantes.como_chegou_a_na` são campos controlados; `visitantes.nome` é gerado como `visitante_N` pelo backend.
- Ingressos só podem ser enviados quando houver ao menos um visitante na ata.
- Preservar payloads, validações de backend, registros históricos e relações por UUID.

---

## Fluxo de Trabalho

1. Revisar `git status`, o diff atual e os arquivos proprietários do comportamento.
2. Identificar separadamente o controle da interface, o schema de domínio, a serialização e a validação aplicada ao Sheets.
3. Implementar a menor alteracao coerente com os contratos existentes.
4. Adicionar ou atualizar testes direcionados.
5. Executar `npm run test`, `npm run lint` e `npm run build`.
6. Se o build alterar `next-env.d.ts`, restaurar somente esse efeito colateral.

---

## Operações no Google Sheets

- Não executar scripts contra a planilha real sem informar antes o impacto e obter autorização explícita.
- `npm run sheets:reconcile-contract` pode criar colunas, migrar dados e reconciliar validações; revisar o diff e os testes antes de executá-lo.
- `npm run sheets:reconcile-protections` altera proteções das abas e depende de `MANUAL_SHEETS_EDIT_ENABLED`.
- Usar planilha exclusiva para testes de escrita. Nunca usar produção como fixture de teste.
