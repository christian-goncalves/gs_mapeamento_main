# Checklist de execução da refatoração V2

## Uso

Única fonte de andamento do pacote V2. `[ ]` pendente, `[!]` depende de decisão/evidência de acesso, `[x]` concluído. Base documental confirmada na ESP-Q10 em 16/10/2026. A F0 foi iniciada por instrução do usuário em 16/10/2026. Ver [evidências F0](evidencias-f0-2026-10-16.md).

## Aprovação do pacote

- [x] Diagnóstico e decisões originais confirmados em Q22.
- [x] Método de planejamento confirmado: detalhamento por fase, blocos publicáveis compatíveis e checkpoint do usuário por fase.
- [x] Decisões transversais de produto desta especificação encerradas: ESP-Q4–Q9.
- [x] Pacote documental conferido globalmente pelo usuário em 16/10/2026, ESP-Q10: “Confirmo a base documental”.
- [x] Execução da F0 autorizada pelo usuário em 16/10/2026.
- [ ] F1 não autorizada; aguarda aceite explícito do CP-00.

## F0

- [x] F00-T01 — Base, branch, commit, worktree e alterações preexistentes identificados e preservados.
- [x] F00-T02 — Usuário confirmou a mesma planilha para DEV/PROD (ID local compatível), acesso admin em DEV e que o perfil Responsável acessa somente o grupo associado pela autenticação.
- [x] F00-T03 — Baseline isolado executado: 44 arquivos/284 testes passaram; lint passou; build passou.
- [x] F00-T04 — Cabeçalhos, linhas e schemas legados DEV confrontados; usuário aceitou a proposta física e manter `Página7` preservada fora do escopo. Nenhuma migração autorizada ou executada.
- [x] F00-T05 — Usuário aceitou Apps Script como gateway, fail-closed/idempotência, teto inicial de 50 atas/1,5 MiB e controle de escritores externos no corte; indicou `chrisapppg1@gmail.com` como conta operacional. Teto será medido com dados sintéticos em F1.
- [x] F00-T06 — Ponto de retorno e recuperação especificados; nenhuma cópia ou restauração executada.
- [x] F00-T07 — Matriz dos 27 requisitos e detalhamento de F1 preparados: [rastreabilidade](rastreabilidade-v2.md), [F1](fase-1-compatibilidade-escrita.md).
- [x] F00-T08 / CP-00 — Conferido pelo usuário: decisões, uso da planilha compartilhada, escopo de acesso do Responsável e conta operacional confirmados. F1 continua sem autorização explícita e não foi iniciada.

## Fases posteriores

- [ ] F1 / CP-01 — Compatibilidade e fundamento de escrita; aguarda autorização explícita para iniciar.
- [ ] F2 / CP-02 — Cadastro, plataformas e agenda.
- [ ] F3 / CP-03 — Preenchimento e resumo.
- [ ] F4 / CP-04 — Revisão e aprovação.
- [ ] F5 / CP-05 — Edição e exclusão versionadas.
- [ ] F6 / CP-06 — Histórico, faltantes e relatórios.
- [ ] F7 / CP-07 — Consistência final.

## Registro de checkpoint — CP-00 em conferência

- **Data e base:** 16/10/2026; `main`, `06d74dafd6625769607d575211a69ea203bcf73e`.
- **Requisitos atendidos:** mapa dos 27 requisitos ligado a tarefas/cenários/checkpoints; F1 detalhada para revisão.
- **Testes e resultados:** `npm test` 44/44 arquivos e 284/284 testes; `npm run lint` passou; `npm run build` passou. Execução isolada, sem `.env.local`.
- **Ambiente validado:** runtime local usa `GS Mapeamento | DEV`; Vercel production atual está READY no mesmo commit. O usuário confirmou o mesmo destino de Sheets em DEV/PROD e seu ID confere com `.env.local`; o valor remoto não foi revelado. Vercel preview não tem `GOOGLE_SHEETS_ID` configurada.
- **Evidências:** [registro técnico F0](evidencias-f0-2026-10-16.md), [matriz de rastreabilidade](rastreabilidade-v2.md), [detalhe F1](fase-1-compatibilidade-escrita.md).
- **Decisões aceitas pelo usuário:** representação física proposta para revisão em F1; `Página7` preservada fora do escopo; Apps Script como gateway único com lock, idempotência e falha fechada; lote inicial limitado a 50 atas/1,5 MiB, a medir sinteticamente em F1; escritores manuais e deployments antigos tratados no corte. O aceite não autoriza alteração de dados, provisionamento, publicação ou ativação.
- **Verificações F0:** usuário confirmou que o perfil Responsável acessa somente o grupo associado pela autenticação e indicou `chrisapppg1@gmail.com` como conta operacional do Apps Script. **Restrição confirmada:** DEV e PROD usam a mesma planilha; qualquer teste com escrita em DEV afetaria essa planilha compartilhada.
- **Ponto de retorno:** procedimento escrito em evidências F0. Nenhum backup foi criado; nenhum dado foi alterado.
- **Decisão do usuário (16/10/2026):** confirmou as decisões/recomendações, o escopo de acesso por grupo e a conta operacional do Apps Script. O aceite do CP-00 não autoriza escrita ou migração em Sheets, provisionamento, publicação ou ativação de funcionalidades sem autorização própria.
- **Próximo escopo:** F0/CP-00 conferido; F1 permanece parada até autorização explícita do usuário.
