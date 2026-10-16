# Plano de execução da refatoração V2

## Situação e regra de avanço

Base do plano confirmada pelo usuário em 16/10/2026 na ESP-Q10, incluindo ordem F0–F7 e checkpoints por fase. A execução da F0 foi autorizada por instrução do usuário em 16/10/2026. O checklist é a única fonte do andamento; a F1 depende do aceite explícito do CP-00.

Fontes: [requisitos](../../produto/refatoracao-v2/especificacao-funcional.md), [contratos](../../arquitetura/refatoracao-v2/contratos-tecnicos.md) e [checklist](checklist-execucao.md). A ordem segue dependências; as seis responsabilidades do diagnóstico não são seis fases obrigatórias.

Cada fase começa com especificação detalhada aprovada, termina com evidências e exige aceite do usuário para avanço. Código e migração/publicação possuem checkpoints distintos quando alteram dados ou disponibilidade.

## Mapa das fases

| Fase | Entrega e dependência | Requisitos principais | Checkpoint |
| --- | --- | --- | --- |
| F0 — Preparação e contratos | Baseline, ambientes identificados, rastreabilidade, schema de transição e decisões transversais fechados. Sem mudança funcional. | Todos, como preparação | CP-00: evidências e contratos suficientes para detalhar e autorizar F1. |
| F1 — Compatibilidade e fundamento de escrita | Leitura/serialização anterior e nova, intervalos corretos, recuperação e coordenação escolhida. Preserva fluxos existentes; prepara migrações, sem expor ações incompletas. Depende de F0. | Contratos transversais, REV-03 | CP-01: comportamento anterior preservado, novo contrato testado em DEV, retorno para versão compatível demonstrado. |
| F2 — Cadastro, plataformas e agenda | Cadastro/mesa, catálogo, vínculo por horário, link efetivo, vigência e Brasília; extras com plataforma explícita. Depende de F1 e contrato temporal fechado. | CAD-01, MES-01, PLA-01/02, AGE-01 | CP-02: cadastro → gravação DEV → releitura → ata com plataforma correta; prova de conversão e preservação histórica. |
| F3 — Preenchimento e resumo | Novos formatos, visitante/ingresso, Resumo editável, grade e detalhe/PDF necessários à correção desses dados. Depende de F1/F2. | FOR-01/02, VIS-01/02, RES-01/02, DET-01/02, PDF-01 | CP-03: responsável e link público equivalentes; dado persistido e relido sem duplicação; legado, tela e PDF consistentes. |
| F4 — Revisão e aprovação | Configuração por grupo, pendências, aprovação individual e lote, auditoria e exclusão de pendentes dos indicadores. Depende de F1; integra consumidores antes de habilitar pendências. | REV-01/02/03/04, REL-01 | CP-04: envio → pendência → aprovação → indicadores, com teste de papéis, lote inválido, repetição e concorrência. |
| F5 — Edição e exclusão versionadas | Revisões imutáveis, índice por família, aprovação explícita da edição e exclusão lógica. Depende de F4. | CIC-01/02, REL-01 | CP-05: revisão e exclusão preservam histórico, não duplicam totais e não autorizam acesso de outro grupo. |
| F6 — Histórico, faltantes e relatórios | Filtros conjuntos, faltantes após duas horas com vigência comprovada, navegação filtrada e acumulado atual desde fundação. Depende de F2/F4/F5. | HIS-01/02/03, REL-02 | CP-06: várias reuniões no dia, limite temporal, fuso, filtros, navegação e totais comprovados em DEV. |
| F7 — Consistência final | Acabamento restante de navegação/layout, paridade PDF e regressão dos fluxos completos em todos os papéis/contextos. Depende das fases anteriores. | UX-01/02, PDF-01 e regressão de todos | CP-07: regressão funcional/visual aprovada, documentação final e pendências claramente encerradas ou decididas. |

A correção mínima de cada consumidor pertence à fase que altera seus dados; F7 não posterga correção de indicadores ou PDF que já deveriam estar consistentes em uma entrega anterior. Ajustes visuais independentes podem ser antecipados somente com alteração explícita do plano no checkpoint, sem misturar regras ainda indisponíveis.

## Estrutura obrigatória do detalhamento de uma fase

- Objetivo, limites e requisitos rastreados.
- Pré-condições comprovadas e contratos das fases anteriores.
- Tarefas pequenas identificadas por `Fnn-Tnn`, com entrega concreta e arquivos proprietários.
- Cenários de sucesso, erro, autorização, histórico e repetição aplicáveis.
- Verificações automatizadas e roteiro manual em DEV, com alvo explicitamente identificado.
- Evidência que define conclusão, condição para parar e checkpoint para conferência do usuário.
- Migração, ativação, publicação e recuperação, quando aplicáveis, com responsabilidades distintas.

## Critério geral de conclusão

Implementação, testes direcionados, `npm test`, `npm run lint` e `npm run build` com resultados registrados; cenário funcional comprovado no ambiente apropriado; rastreabilidade atualizada; regressões e limitações resolvidas ou submetidas à decisão. Falha não pode ser declarada sucesso por ser preexistente: documentar alcance e impedir avanço que dependa da garantia ausente.

## Publicação e recuperação

Bloco publicável possui comportamento útil ou compatibilidade operacional comprovada; permanece compatível com a estrutura existente no momento da ativação. Migração recebe revisão de impacto e autorização própria. Testes de escrita usam DEV exclusivo. Identificação de ambiente deve ser confirmada no momento da operação, não por nome de arquivo ou nota antiga.

Retorno de código preserva dados já gravados e exige leitor compatível. Recuperação de dados possui procedimento próprio, export validado, conferência posterior e autorização; não restaurar backup indiscriminadamente sobre registros válidos criados após a exportação.
