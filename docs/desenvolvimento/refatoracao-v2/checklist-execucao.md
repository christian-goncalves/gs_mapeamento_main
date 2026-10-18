# Checklist de execução da refatoração V2

## Uso

Única fonte de andamento do pacote V2. `[ ]` pendente, `[!]` depende de decisão/evidência de acesso, `[x]` concluído. Base documental confirmada na ESP-Q10 em 16/10/2026. A F0 foi iniciada por instrução do usuário em 16/10/2026. Ver [evidências F0](evidencias-f0-2026-10-16.md).

## Aprovação do pacote

- [x] Diagnóstico e decisões originais confirmados em Q22.
- [x] Método de planejamento confirmado: detalhamento por fase, blocos publicáveis compatíveis e checkpoint do usuário por fase.
- [x] Decisões transversais de produto desta especificação encerradas: ESP-Q4–Q9.
- [x] Pacote documental conferido globalmente pelo usuário em 16/10/2026, ESP-Q10: “Confirmo a base documental”.
- [x] Execução da F0 autorizada pelo usuário em 16/10/2026.
- [x] F1 autorizada pelo usuário em 16/10/2026 após conferência do CP-00.

## F0

- [x] F00-T01 — Base, branch, commit, worktree e alterações preexistentes identificados e preservados.
- [x] F00-T02 — Usuário confirmou a mesma planilha para DEV/PROD (ID local compatível), acesso admin em DEV e que o perfil Responsável acessa somente o grupo associado pela autenticação.
- [x] F00-T03 — Baseline isolado executado: 44 arquivos/284 testes passaram; lint passou; build passou.
- [x] F00-T04 — Cabeçalhos, linhas e schemas legados DEV confrontados; usuário aceitou a proposta física e manter `Página7` preservada fora do escopo. Nenhuma migração autorizada ou executada.
- [x] F00-T05 — Usuário aceitou Apps Script como gateway, fail-closed/idempotência, teto inicial de 50 atas/1,5 MiB e controle de escritores externos no corte; indicou `chrisapppg1@gmail.com` como conta operacional. Teto será medido com dados sintéticos em F1.
- [x] F00-T06 — Ponto de retorno e recuperação especificados; nenhuma cópia ou restauração executada.
- [x] F00-T07 — Matriz dos 27 requisitos e detalhamento de F1 preparados: [rastreabilidade](rastreabilidade-v2.md), [F1](fase-1-compatibilidade-escrita.md).
- [x] F00-T08 / CP-00 — Conferido pelo usuário: decisões, uso da planilha compartilhada, escopo de acesso do Responsável e conta operacional confirmados.

## Fases posteriores

- **Decisão do usuário (16/10/2026):** autorizou usar a planilha `GS Mapeamento | DEV` (`1oHQ_VgwlRHEEUZP5gXyUX8RiGz0hEEZebHUhXiy1imU`) para os testes de escrita da F1, embora DEV e PROD compartilhem o mesmo arquivo. O usuário aceita que qualquer escrita de teste afete também PROD. Esta decisão dispensa a preparação de uma planilha isolada para esta validação, mas não substitui a conferência do backup/export, do alvo e do procedimento de recuperação antes da primeira escrita.
- **Decisão do usuário (16/10/2026):** para reduzir bloqueios, o desenvolvimento local da F2 pode começar sem fechar CP-01. CP-01 continua como gate antes de novas gravações reais em Sheets, migração, cutover, publicação ou ativação. A autorização de escrita F1 não se estende a gravações de negócio da F2; nenhuma aprovação adicional é necessária para código local e testes sintéticos.
- [ ] F1 / CP-01 — Em andamento. **Classificação observada por tarefa:**
  - F10-T01 — **Parcialmente concluído:** inventário dos pontos locais de escrita comprovado; deployments atuais/antigos, escritores de terceiros, edição manual e janela de corte não foram reconfirmados nesta auditoria.
  - F10-T02 — **Implementação local concluída e comprovada:** adaptadores V1/V2, aliases, intervalos derivados, colunas após Z, defaults e limites sintéticos cobertos por testes. A compatibilidade da planilha real após transição continua pendente.
  - F10-T03 — **Parcialmente concluído:** cliente HMAC, gateway, lock, guards, lote/ledger e consulta assinada têm testes locais; no runtime do Gateway v2, uma operação assinada real retornou HTTP 200 / `ok: true` / `existing: false`; a consulta posterior retornou `aplicada` e o ledger confirmou uma linha concluída com hash correspondente.
  - F10-T04 — **Parcialmente concluído:** em 16/10, writers locais de negócio estavam encaminhados ao gateway e tinham testes; rotinas estruturais/destrutivas continuavam diretas, e a cobertura/corte dos writers externos não foi comprovada. **Atualização local de 17/10:** por decisão do usuário, os writers locais de negócio voltaram a usar `spreadsheets.batchUpdate` diretamente pela credencial do app; nenhuma chamada ao Sheets foi feita pelo agente nesta alteração. O código e deployment Apps Script foram preservados para retorno; nenhum deployment remoto foi alterado. A escolha retoma o comportamento direto local e mantém a coordenação entre escritores fora do gateway sem comprovação.
  - F10-T05 — **Parcialmente concluído:** timeout consulta o mesmo ID/hash, reconhece apenas `concluida` e não faz retry automático; a ausência no ledger segue inconclusiva. Reconciliação manual e recuperação operacional não foram demonstradas.
  - F10-T06 — **Parcialmente concluído:** limites sintéticos de 50 atas/1,5 MiB têm testes de fronteira; payload representativo com guards completos ainda não foi medido.
  - F10-T07 — **Parcialmente concluído:** backup e procedimento de recuperação estavam registrados; uma gravação no-op controlada no alvo compartilhado foi confirmada no ledger e na leitura pós-escrita sem diferença nos valores enviados. Ainda faltam ambiente isolado e demonstração de retorno/restauração preservando registros posteriores ao backup.
  - F10-T08 — **Parcialmente concluído:** checklist e evidências atualizados; CP-01 ainda não está pronto para aceite.
  **Base mínima para prosseguir com código local:** atendida pelos testes locais existentes e pela operação no-op confirmada no runtime, com guard, lote atômico, ledger e leitura posterior. **Pendências de CP-01 operacional:** medir payload representativo, coordenar writers/corte e demonstrar retorno/restauração compatível antes de novas gravações reais ou ativação. CP-01 não aceito; isso não bloqueia F2 local. Ver [detalhe F1](fase-1-compatibilidade-escrita.md) e [evidências F1](evidencias-f1-2026-10-16.md).
- [ ] F2 / CP-02 — Cadastro, plataformas e agenda. **Estado desta execução:** fase incompleta; CP-02 não apresentado para aceite.
  - CAD-01 — implementação local existente conferida: rótulos de e-mail/link simplificados, seletor de fuso removido mantendo `fuso_horario` no formulário e seção de horários com ajuda de Brasília acessível por mouse, foco/teclado e toque. Teste funcional automatizado de interface e revisão visual manual ainda pendentes.
  - MES-01 — implementação local existente conferida: lista/relatório usam encargos cadastrados, cadastro/modal permitem encargos conhecidos ou Outro, nome e Desde, alteração e remoção; vazio aparece como Vago e os campos continuam texto livre. Três expectativas antigas de teste foram alinhadas à regra de remover encargos e apresentar vagas. Testes direcionados passaram (33/33); revisão visual manual pendente.
  - PLA-01/02 — pendentes de implementação: catálogo `grupo_plataformas`, vínculo de plataforma por horário, seleção efetiva na previsão da ata e exceção de link com origem identificável. Próximo passo local: integrar o cabeçalho já previsto em `V2_NEW_SHEET_HEADERS` ao reader, domínio, ações gateway, editor do grupo e formulário de ata; cobrir compatibilidade e testes sintéticos sem reconciliar a planilha.
  - AGE-01 — pendente: conversão consistente de agenda para Brasília a partir do fuso de origem, inclusive virada de dia, nos consumidores da fase; também falta validar reunião extra com escolha explícita de plataforma e sem recorrência.
  - Verificações desta execução: `npm test -- --maxWorkers=1` passou (48 arquivos/351 testes); ESLint direcionado e `npm run lint` passaram; `git diff --check` passou. `npx tsc --noEmit` falha em fixtures tipados de vários testes, principalmente grupos sem `fuso_horario`, `plataforma` e `acesso_plataforma`; não foram observados diagnósticos em arquivos-fonte de implementação ao excluir linhas `.test.ts` do resultado.
  - Pendências de validação: testes de interação/visual em interface, casos de conversão temporal, teste funcional de seleção plataforma→ata e conferência do fluxo em DEV após autorização/gates próprios. Nenhuma gravação de negócio F2 em Sheets foi executada ou autorizada por esta decisão. CP-01 permanece gate para gravações reais, migração, cutover, publicação e ativação.
  - Ponto de retomada: implementar PLA-01/02 começando pelo modelo de plataforma e associação de horário; depois concluir AGE-01, completar testes funcionais/visuais e critérios CP-02. Não repetir a cobertura local CAD-01/MES-01 sem evidência de regressão.
  - Validação manual da troca de writer: pendente do usuário. Ao cadastrar um grupo pela aplicação local, a gravação irá para a planilha compartilhada indicada (`GS Mapeamento | DEV`, também usada por PROD); o usuário decidirá se mantém ou exclui o registro. Nenhuma linha foi criada ou removida pelo agente.
- [ ] F3 / CP-03 — Preenchimento e resumo. **Estado desta execução:** implementação local avançou parcialmente; fase incompleta e CP-03 não apresentado para aceite, pois F2 ainda tem PLA-01/02 e AGE-01 pendentes e a integração da plataforma efetiva depende deles.
  - FOR-01 — compartilhamento do schema e do parser entre envio autenticado e link público mantido; validação automatizada de domínio passou. Equivalência funcional dos dois acessos ainda requer conferência manual.
  - FOR-02 — Comemorativa e Serviço acrescentados ao modelo e às colunas V2; Outros continua texto livre e leitura legada usa defaults. Testes de serialização e compatibilidade passaram. Nenhuma migração ou gravação em Sheets foi executada.
  - VIS-01 — checkbox de ingresso aparece apenas para Provável adicto; o rascunho deriva a cidade e o nome do visitante, persiste `visitante_id` explícito e limpa a marcação ao remover/mudar categoria. Testes de vínculo e validação passaram; interação manual pendente.
  - VIS-02 — ingressos legados sem `visitante_id` permanecem independentes; leitura não deduz vínculo por cidade/ordem. Testes de integridade passaram; dados reais não foram alterados.
  - RES-01/02 — resumo foi movido ao fim do formulário, mantém Membros/Partilhas editáveis e mostra os outros totais calculados na grade 3×3. Tela de detalhe e PDF usam a mesma contagem; teste automatizado passou, revisão visual manual pendente.
  - DET-01/02 — título, índice 01–09, informações gerais e listas foram ajustados; UUID e sequencial técnico deixaram de aparecer na tela/PDF, com relações persistidas preservadas. Testes de renderização passaram; conferência visual de impressão pendente.
  - PDF-01 — composição usa os mesmos dados, rótulos e métricas da tela e mantém páginas A4; suíte PDF passou. Conferência manual de impressão e plataforma efetiva depende de F2.
  - Verificações desta execução: `npm test -- --maxWorkers=1` passou (48 arquivos/353 testes); `npm run lint` passou; `npm run build` passou; `git diff --check` passou. O build reescreveu `next-env.d.ts`; o conteúdo preexistente foi restaurado exatamente. A primeira execução paralela teve timeout em um teste PDF, que passou isolado e na suíte sequencial.
  - Pendências/gates: F2/CP-02 segue incompleta; CP-01 segue não aceito e bloqueia gravações reais, migração, cutover, publicação ou ativação. Não houve leitura funcional de tela/PDF em DEV, gravação, migração nem mudança externa. CP-03 exige comprovar envio autenticado e público equivalentes, persistência/readback sem duplicação, legado/tela/PDF consistentes e plataforma efetiva do horário.
  - Ponto de retomada: concluir PLA-01/02 e AGE-01 da F2; depois conferir visualmente formulário responsivo, resumo, detalhe e impressão, integrar plataforma/horário efetivos, executar cenário autorizado em ambiente identificado com leitura posterior e fechar as evidências do CP-03. Não repetir os testes locais já aprovados sem evidência de regressão.
- [ ] F4 / CP-04 — Implementação local concluída; validação e checkpoint pendentes.
  - REV-01/02 — Leitura do campo `grupos.revisao_atas_ativa` preservada pelo reader V2. Os envios autenticado e público consultam essa configuração no servidor; novos registros recebem `ativa` e `aprovada` ou `pendente_revisao`. O envio falha fechado se as colunas de estado/auditoria ainda não estiverem reconciliadas. Desligar a configuração afeta somente envios futuros. Legado ausente continua ativo/aprovado. Aprovação automática registra `sistema` e o horário de criação, conforme decisão do usuário em 17/10/2026.
  - REV-03 — Ações de aprovação aceitam somente sessão autenticada; o writer relê acesso, grupo, situação, pendência e `updated_at`. Responsável fica limitado aos grupos atuais associados; administrador pode aprovar em qualquer grupo. Link público permanece somente envio.
  - REV-04 — Painel de revisão permite aprovação individual e em lote da página visível (10 itens), confirma nomes/quantidade, limpa a seleção ao trocar página e rejeita o lote inteiro se algum item estiver inválido. O writer limita o lote a 50 atas/1,5 MiB e usa uma chamada `batchUpdate`.
  - REL-01 — Histórico do administrador e do responsável mostra Pendentes de revisão; pendentes continuam recebidas para não projetar ausência. Listagens e indicadores excluem registros não ativos, e os indicadores mensais/contadores usam somente atas aprovadas.
  - Verificações: nenhuma suíte, lint ou build executados, conforme instrução do usuário. Nenhuma escrita em Sheets, migração, alteração de Apps Script, publicação ou ativação externa foi feita.
  - Pendências: executar testes direcionados, lint e build quando solicitado; CP-01 segue não aceito, então coordenação entre instâncias/escritores, ledger, repetição e concorrência da gravação de aprovação não estão comprovados. CP-04 não apresentado para aceite.
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
