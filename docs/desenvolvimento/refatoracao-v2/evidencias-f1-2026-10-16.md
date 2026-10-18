# Evidências da F1 — 16/10/2026

## Estado desta continuação local

- **Implementação local:** compatibilidade V1/V2, cliente HMAC, gateway, ledger, consulta assinada, limites e roteamento dos writers de negócio estão no worktree. A auditoria fechou uma lacuna local na capacidade operacional de simulação: o gateway agora valida que as atas gravadas pertencem ao grupo declarado e que registros dependentes referenciam somente as atas desse pedido. Os fluxos autenticados continuam revalidando ator/grupo sob lock; link público, ativação, login, recuperação, simulação e reparo operacional permanecem capacidades distintas e sem identidade autenticada inventada.
- **Validações locais executadas nesta auditoria:** `npm test -- --maxWorkers=1` passou com 48 arquivos/351 testes; `npm run lint`, `npm run build`, `node --check apps-script/gateway/Code.js` e `git diff --check` passaram. Testes adicionais cobrem capacidades de sincronização de usuário, login, recuperação/reset, simulação e reparo de link; todos foram executados no harness local.
- **Validação externa observada:** metadados confirmaram o alvo `GS Mapeamento | DEV` com 12 abas, incluindo `operacoes`, e o backup pré-escrita registrado abaixo com 11 abas. Uma única operação assinada no Gateway v2 foi concluída em 16/10/2026: HTTP 200, `ok: true`, `existing: false`. A consulta assinada retornou `aplicada`; o ledger contém exatamente uma linha concluída com hash correspondente; a leitura pós-escrita dos quatro campos enviados correspondeu aos mesmos valores e tipos do pré-voo. Nenhuma diferença de negócio foi encontrada. O export XLSX permanece como evidência histórica e não foi reaberto nesta continuação.
- **Pendências externas:** payload representativo completo, corte/coordenação de writers externos, validação em planilha isolada, recuperação integrada após estado inconclusivo e retorno a versão compatível continuam sem demonstração.
- **Bloqueios de CP-01 operacional:** não há coordenação de todos os writers externos nem demonstração de retorno/restauração em ambiente isolado. CP-01 não aceito para novas gravações reais, migração, cutover ou ativação. O desenvolvimento local da F2 foi iniciado por uma pequena alteração de rótulos CAD-01; nenhuma gravação F2 foi feita.

## Classificação revalidada das tarefas F1 — 16/10/2026

| Tarefa | Classificação | Fato comprovado e pendência remanescente |
| --- | --- | --- |
| F10-T01 — Inventário | Parcialmente concluído | Varredura local identifica writers de negócio roteados e rotinas estruturais/destrutivas diretas. Estado atual de deployments antigos, terceiros, edição manual e janela de corte não foi revalidado. |
| F10-T02 — Compatibilidade | Implementação local concluída e comprovada; validação total parcial | Adaptadores e testes sintéticos cobrem prefixo/estados V1/V2, aliases, intervalos derivados e colunas além de Z. A planilha não recebeu o contrato V2 e não houve comparação real após uma transição. |
| F10-T03 — Gateway | Parcialmente concluído | Além dos testes VM, o Gateway v2 executou uma operação assinada real com guard, `batchUpdate` e ledger, seguida de consulta assinada `aplicada`. Homologação mais ampla, limites e falhas/timeout reais continuam pendentes. |
| F10-T04 — Writers | Parcialmente concluído | Escritores de negócio locais usam gateway e têm testes de ações/políticas. Reconciliação, proteções e reset continuam operações diretas de operador; simulação continua invocável. Writers externos e corte não foram comprovados. |
| F10-T05 — Timeout/recuperação | Parcialmente concluído | Testes cobrem consulta pós-falha, sucesso confirmado, ausência/conflito/estado inconclusivo e ausência de retry automático. Ausência não prova encerramento da chamada; reconciliação manual e recuperação operacional não foram executadas. |
| F10-T06 — Limites | Parcialmente concluído | Testes sintéticos cobrem 50 atas e 1,5 MiB. Não se mediu payload representativo com guards completos nem o payload produzido por integração real. |
| F10-T07 — Compatibilidade/retorno | Parcialmente concluído | Uma gravação no-op controlada na planilha compartilhada teve ledger e leitura posterior correspondentes. O teste não foi isolado, e restauração/retorno compatível com dados posteriores ao backup não foi demonstrado. |
| F10-T08 — Pacote CP-01 | Parcialmente concluído | Checklist, evidências e limites foram atualizados. O checkpoint não está pronto para aceite enquanto faltarem os cenários externos acima. |

### Próxima etapa dependente do usuário

A gravação no-op autorizada na planilha compartilhada foi realizada e conferida. O mínimo para continuar código local foi atendido. A primeira fatia CAD-01 de rótulos foi implementada localmente. Para liberar novas gravações reais e cutover, ainda faltam medir payload representativo, coordenar writers externos e demonstrar retorno/restauração em ambiente isolado sem sobrescrever linhas válidas posteriores ao backup. Gravações F2 em Sheets não estão autorizadas por essa decisão.

## Continuação local — atualização 16/10/2026

- Regra de identidade esclarecida pelo usuário: aprovações são feitas por responsável ou administrador autenticado com o próprio e-mail. Para envios autenticados de ata, a Server Action confere o escopo e passa o e-mail autorizado ao writer; dentro do lock, o gateway revalida responsável/grupo ou administrador. `preenchido_por` permanece texto livre, não identidade. O link público usa capacidade própria vinculada ao token e grupo ativos, sem poder de aprovação.
- Testes locais confirmam que o e-mail da sessão chega ao writer autenticado e que o gateway repete a checagem de identidade/escopo. Um caso adicional confirma a recusa de ata para grupo inativo.
- Para `atualizar_indice_ata`, o Apps Script confere sob lock que o e-mail do ator está em `GATEWAY_ADMIN_EMAILS` ou corresponde a um usuário ativo no grupo ativo da ata atual; também verifica se a linha escrita preserva `ata_id` e `grupo_id` do registro lido. A gravação controlada desta continuação passou pela política de responsável/grupo no runtime. A comparação integral da lista administrativa com `AUTH_ALLOWED_EMAILS` continua pendente.
- Continuação após interrupção do editor: a verificação do worktree confirmou que as alterações e exclusões já registradas permanecem presentes. Nenhum arquivo foi restaurado, removido, staged ou commitado.

- Worktree conferido antes das alterações desta continuação. Já havia exclusões em `docs/REFATORACAO-1_MARCOS/` e `docs/analise-diagnostico/`, alterações V2 e outros arquivos do projeto modificados/não rastreados; foram preservados, sem staging, reset ou commit.
- `group-admin.ts` e `group-users.ts` passaram a enviar gravações de negócio ao gateway com ID determinístico, guard do snapshot usado, e lote único para equipe da mesa e exclusões de horários. Testes existentes desses módulos foram adaptados para observar o gateway e os destinos.
- A varredura por `values.update`, `values.append` e `spreadsheets.batchUpdate` não encontrou escrita direta remanescente nos writers de negócio; a função genérica `executeAtomicBatch` também foi removida. As ocorrências diretas remanescentes são `contract-reconciliation.ts`, `protection-policy.ts` e `reset-ata-record-sheets.ts`: rotinas estruturais/destrutivas de operador que seguem fora do gateway de negócio e devem permanecer suspensas no corte. O script mensal de simulação chama agora o serviço roteado ao gateway, mas continua sendo um comando operacional invocável e não foi desabilitado.
- O cliente HMAC limita a espera HTTP a 30 s e classifica falha de rede/timeout como resultado indeterminado, preservando o ID para reconciliação. O código Apps Script valida UUID/hash, impede escrita na linha de cabeçalho, limita linhas/colunas aos contratos por aba e rejeita fórmulas/outros tipos de célula. `appendDimension` só é aceito para expansão de linhas em abas de negócio, com limite de 1.000 linhas por request; a expansão é enviada junto às mutações e ao ledger no mesmo lote.
- A revisão encontrou que a simulação mensal gerava `appendDimension`, mas o gateway o rejeitava; o caminho não funcionaria numa execução real. A validação do gateway agora permite apenas esse caso restrito e reconstrói cada request com campos explicitamente permitidos. A exclusão de dimensão também exige índices inteiros. Foram adicionados cenários de expansão válida, limites/abas/dimensões proibidos e descarte de campos extras.
- `apps-script/gateway/Code.test.ts` executa o próprio `Code.js` em VM Node com substitutos locais para `PropertiesService`, `LockService`, `Utilities`, `Sheets` e `ContentService`. O conjunto atual tem 30 testes locais, incluindo HMAC/guard, lote único com ledger, repetição idempotente, limites e sanitização, consulta de status e políticas por identidade/capacidade. Este harness não é execução nem homologação do runtime Google Apps Script.
- A execução interrompida quando o VS Code fechou encerrou os processos de lint/build sem resultado recuperável. Vitest tinha terminado antes da interrupção. Lint e build foram então reexecutados; o primeiro build apontou um erro de tipo no lote da equipe da mesa, corrigido antes da passagem final.
- Até a execução controlada registrada abaixo, nenhuma escrita havia sido feita nesta planilha. O backup e export não foram usados nem restaurados.

## Autorização e limite atual

- O usuário autorizou iniciar a F1 depois de conferir o CP-00.
- O usuário autorizou usar a planilha compartilhada entre DEV/PROD para os testes da F1 e confirmou o ID `1oHQ_VgwlRHEEUZP5gXyUX8RiGz0hEEZebHUhXiy1imU` como planilha de ambos os ambientes. Essa autorização não torna DEV isolado de PROD; qualquer escrita afeta a mesma planilha.
- Backup nativo criado antes de qualquer escrita: [GS Mapeamento | BACKUP F1 CP-01 | 2026-10-16 | pré-escrita](https://docs.google.com/spreadsheets/d/1JrW05ugRILp-zc7Rbcl0fUd1meHqAthtYflmBEXJOYs/edit). ID do backup: `1JrW05ugRILp-zc7Rbcl0fUd1meHqAthtYflmBEXJOYs`.
- Export XLSX obtido via Google Drive para o mesmo backup: 1.254.129 bytes; título, locale/timezone e 11 abas foram confirmados nos metadados da cópia. Títulos/ordem, sheet IDs e dimensões das grades coincidem com a origem na leitura de metadados. Não foram registrados valores de negócio. A cópia e export permanecem como pontos de retorno; nenhuma restauração foi feita.
- O procedimento de recuperação da F0 segue aplicável. Nesta continuação, o título/ID do alvo foram reconfirmados e a operação foi registrada pelo `operacao_id` abaixo. O backup tem 11 abas e o alvo atual tem 12, pois `operacoes` foi criada depois da cópia; qualquer recuperação deve preservar a linha válida posterior no ledger. Publicação adicional do Apps Script e ativação de funcionalidades seguem fora do escopo desta continuação.

## F10-T01 — Inventário de escritores (levantamento local)

| Fluxo | Entrada/ator observado | Escrita atual | Situação de corte |
| --- | --- | --- | --- |
| Criação de ata | Ações de criação de ata por sessão e link; `src/app/atas/nova/actions.ts` | A Server Action autenticada verifica o escopo e passa o e-mail da sessão; o gateway revalida administrador/responsável, grupo ativo e destino da ata sob lock. O caminho público exige token ativo associado ao mesmo grupo e não recebe identidade de sessão. O writer envia ID determinístico e guards; `preenchido_por` segue texto livre. | Roteado e coberto por testes locais. Integração e repetição/timeout reais pendentes. |
| Índice personalizado de ata | Ação administrativa/autorizada `src/app/atas/actions.ts` | `src/lib/sheets/ata-admin.ts` encaminha alteração pelo gateway com ID do formulário, ator autenticado e guard da linha. O Apps Script confere dentro do lock a lista admin ou o vínculo ativo responsável/grupo, e amarra a linha escrita à ata/grupo atuais. | Roteado e revalidado localmente para esse writer; runtime Apps Script e integração real pendentes. |
| Cadastro e alterações de grupo/horário/equipe | Administração de grupos | `src/lib/sheets/group-admin.ts` usa `executeGatewaySheetWrite` para atualizar/adicionar linhas e excluir horários em lote; envia guards do snapshot lido. | Revalidação local sob lock: administrador configurado ou responsável ativo do grupo; destino e campos permitidos conferidos. Operações compostas podem concluir parcialmente entre chamadas gateway distintas. |
| Usuários do grupo e credenciais | Ativação, redefinição de senha, login e sincronização de responsável | `src/lib/sheets/group-users.ts` usa `executeGatewaySheetWrite`; o guard cobre o snapshot de `usuarios_grupo`. | Sincronização/rotação administrativas exigem admin autenticado. Ativação, login e recuperação usam capacidades limitadas à linha, grupo, token e campos permitidos; não inventam e-mail autenticado. |
| Simulação mensal de atas | Comando `atas:simulate:commit-dev` (`.agents/skills/simular-atas-mensais/scripts/simulate-atas-month.ts`) | `src/lib/sheets/create-simulated-atas.ts` chama `executeGatewayAtomicBatch`. | Roteado localmente; o comando segue invocável e deve ser suspenso no corte. Não executar durante validação atual. |
| Reconciliação de contrato | `sheets:reconcile-contract` | `src/lib/sheets/contract-reconciliation.ts` aplica alterações estruturais/valores via Sheets API. | Rotina de operador, fora do caminho de negócio; suspender durante corte e manter autorização operacional própria. |
| Reconciliação de proteções | `sheets:reconcile-protections` | `src/lib/sheets/protection-policy.ts` usa `batchUpdate`. | Rotina estrutural de operador; suspender durante corte. |
| Reset de registros de ata | `sheets:reset-ata-records` (`scripts/reset-ata-record-sheets.ts`) | Script administrativo com modo dry-run e modo `--execute`. | Operação destrutiva; manter bloqueada durante o corte e fora do gateway de negócio. |
| Sugestões de nomes | `src/lib/ata-name-suggestions.server.ts` | Escrita em arquivo local de sugestões; não é escrita no Sheets. | Fora do gateway Sheets; confirmar efeito secundário no desenho de operação de criação. |

### Cobertura externa ainda não fechada

- Vercel production e deployments antigos foram listados na F0; o mais recente está no mesmo commit da base F0, e existem deployments anteriores `READY`. A proteção SSO da URL de deployment não equivale a suspender o writer.
- Edição manual na planilha permanece possível fora do lock do Apps Script.
- Nenhuma implantação Apps Script ou rotina externa foi criada/inspecionada nesta etapa. A conta operacional indicada é `chrisapppg1@gmail.com`.
- Portanto, o inventário local está concluído; o corte real e a prova de coordenação de todos os escritores permanecem pendentes para CP-01.

### Verificação adicional do inventário local

- Varredura executada sobre o repositório por `values.update`, `values.append`, `spreadsheets.batchUpdate`, `updateCells`, `appendDimension`, `insertDimension`, `deleteDimension`, `repeatCell`, `setValues`, `appendRow`, `clearContent` e usos de clientes Google/Apps Script. Não foram encontrados writers de negócio diretos restantes no código da aplicação.
- `contract-reconciliation.ts`, `protection-policy.ts` e `reset-ata-record-sheets.ts` são os únicos caminhos locais restantes que enviam mutações Sheets diretamente: respectivamente migração/reconciliação estrutural, configuração estrutural de proteções e reset destrutivo de registros. São rotinas de operador e precisam permanecer suspensas no corte, sob autorização operacional própria.
- `rebuild-ata-name-suggestions.ts`, `update-municipios.mjs` e `update-paises.mjs` escrevem arquivos locais do projeto, não a planilha. A auditoria responsiva também grava relatório local. Não foram classificados como writers Sheets.
- `atas:simulate:commit-dev` é comando operacional de negócio e agora passa pelo gateway; continua invocável localmente e não foi executado nem desabilitado.
- O escopo local não prova o estado de deployments antigos, scripts externos, integrações de terceiros nem edição manual da planilha. A cobertura externa e a suspensão durante o cutover continuam pendentes; não foram feitas consultas externas nesta continuação.

## F10-T02 — Compatibilidade local

- Implementado módulo de contrato V2 paralelo ao contrato atual: campos aprovados de `atas`, `grupo_horarios`, `ingressos` e os cabeçalhos das novas abas `grupo_plataformas` e `operacoes`.
- Leitores atuais de repositório, criação, simulação, administração de atas, usuários e grupos agora derivam o alcance de leitura da largura do contrato compatível, incluindo colunas após Z.
- Extensões V2 só são toleradas se todos os cabeçalhos base mantiverem a ordem exata e o sufixo corresponder integralmente aos campos V2 aprovados. A validação padrão de `rowsToObjects` permanece estrita.
- Campos legados de estado de ata sem valor usam defaults canônicos `ativa`/`aprovada`; estados desconhecidos são recusados. As novas colunas ainda não foram adicionadas à planilha.
- Testes sintéticos cobrem prefixo V1/V2, validação estrita, conversão de coluna acima de Z, aliases históricos de `visitantes`, defaults/estados inválidos e limites/hash da operação. A execução anterior, após roteamento da alteração de índice, passou: 47 arquivos/299 testes. A execução paralela padrão havia atingido timeout de 5 s no teste de PDF; esse arquivo passou isolado.
- `npx tsc --noEmit` retorna erros em fixtures de teste do repositório; checagem filtrada confirmou zero diagnósticos nos arquivos F1 alterados.

## F10-T03/F10-T04 — Gateway e cutover

- O usuário aprovou HMAC compartilhado entre backend Vercel e Apps Script em 16/10/2026. O segredo permaneceu fora dos registros; a resposta válida do endpoint confirma que a autenticação assinada estava configurada no runtime.
- Fonte local em `apps-script/gateway/Code.js` e `appsscript.json`: HMAC e janela de timestamp, ID/hash idempotente, limite de bytes/atas, `getScriptLock`, validação dos guards e `batchUpdate` único para mutações permitidas mais ledger. O ledger não cria estado `pendente`: dados e conclusão são enviados atomicamente; ID já concluído retorna o resultado existente e hash divergente é recusado.
- Cliente server-only em `src/lib/sheets/gateway-client.ts`: assina JSON canônico com HMAC-SHA256, aplica timeout HTTP de 30 s e falha fechado em rede, timeout ou resposta inválida, preservando o `operacao_id` para reconciliação.
- Continuação local: `doPost` agora aceita consulta somente leitura `query` autenticada por HMAC e timestamp, com o mesmo lock global usado nas mutações. Com ID/hash correspondentes, retorna `aplicada`; divergência, duplicidade de ledger, estado não concluído ou lock indisponível retornam estado não conclusivo. O cliente consulta automaticamente o ledger após falha de transporte, resposta inválida ou erro do `batchUpdate`; só converte para sucesso quando encontra registro concluído. Não repete a escrita em nenhum estado.
- A consulta que retorna `nao_encontrada` mantém `safe_to_retry: false`: pode haver uma chamada original ainda em trânsito que não obteve o lock quando a consulta foi lida. Esse endpoint permite reconciliar automaticamente o caso confirmado como aplicado, mas ausência não libera repetição nem prova que a operação original cessou. Uma rotina humana de análise continua necessária nesses casos.
- Se o Apps Script receber erro ao chamar `spreadsheets.batchUpdate`, responde `WRITE_RESULT_UNKNOWN` e o cliente consulta o ledger. O Apps Script Advanced Service não foi executado no runtime Google; portanto, ainda não há evidência para distinguir em runtime erro pré-commit de perda de resposta pós-commit. A resposta de erro continua sendo JSON de `doPost`, sem status HTTP de domínio confiável.
- O gateway exige aba `operacoes` existente com cabeçalho aprovado e IDs/secret em Script Properties; não cria a aba implicitamente.
- O Gateway já estava implantado na versão 2 antes desta continuação; nenhum novo deployment foi feito.
- `create-ata.ts`, `create-simulated-atas.ts`, `ata-admin.ts`, `group-admin.ts` e `group-users.ts` agora encaminham as mutações de negócio ao gateway. Nas operações autenticadas, o ator é o e-mail validado da sessão. Nos caminhos sem sessão, o ator técnico é apenas rótulo operacional e a autorização vem da capacidade/token específico, não de uma identidade autenticada.
- `ata-admin.ts` também encaminha a alteração do índice personalizado com `operation_id` criado no formulário e ator da sessão administrativa/autorizada.
- Guards são hashes SHA-256 dos valores em JSON canônico; o Apps Script relê com `UNFORMATTED_VALUE` e `SERIAL_NUMBER` e compara enquanto mantém `getScriptLock`, alinhando a representação com a leitura do cliente. A verificação não coordena edições manuais, scripts antigos ou processos que não usem este projeto Apps Script.
- A lista de operações e limites de abas/ranges/células é validada no Apps Script. A operação no-op observada confirmou em runtime `LockService`, guard, `Sheets.Spreadsheets.batchUpdate`, ledger e resposta `ContentService` para um caso mínimo; não prova todos os caminhos de negócio, limites ou erros.
- A consulta somente leitura do ledger também foi executada no runtime e retornou `aplicada` para o mesmo ID/hash. A ausência de linha continua sem provar que uma solicitação ainda em trânsito terminou; ela nunca é convertida em retry automático.
- O usuário confirmou que aprovações são executadas por responsável ou administrador autenticado; o e-mail da sessão é usado como ator nas operações autenticadas. Dentro do lock, o gateway revalida localmente `criar_ata`, `atualizar_indice_ata`, writers de grupos/horários/equipe e sincronização administrativa de usuário. Administradores precisam constar em `GATEWAY_ADMIN_EMAILS`, que deve espelhar `AUTH_ALLOWED_EMAILS`; responsáveis precisam ter vínculo ativo com o grupo ativo. A alteração de grupo por responsável fica restrita aos campos permitidos pela Server Action; gravações não podem substituir linha de outro grupo. A criação por link usa capacidade de token público, que é conferido novamente contra o link ativo e o grupo da ata.
- Ativação, redefinição, login e solicitação de recuperação usam capacidades explícitas sem atribuir e-mail autenticado. O gateway confere o usuário, grupo e linha atuais; tokens de ativação/reset precisam corresponder ao valor vigente e estar dentro da validade, e cada capacidade limita os campos alteráveis. A simulação mensal e o reparo operacional de link também têm marcadores próprios, sem identidade de sessão. Essas rotas estão testadas somente no harness Node; política e comportamento ainda dependem de homologação no runtime Apps Script. Nenhuma configuração externa foi feita.
- A proteção de colunas não prova semântica de negócio de cada request: as rotinas confiáveis do backend ainda constroem os payloads permitidos. Ações de grupo compostas por várias operações gateway podem sofrer conclusão parcial entre chamadas, apesar da atomicidade de cada `batchUpdate` individual.

## F10-T06 — Limites sintéticos

- `src/lib/sheets/operation-envelope.ts` serializa payload JSON com ordenação canônica de chaves, calcula SHA-256 e mede os bytes UTF-8 antes do envio.
- Rejeita operação vazia/inválida, mais de 50 atas e payload acima de 1.572.864 bytes; testes confirmam aceitação nos limites exatos de 50 atas e 1,5 MiB, rejeição acima deles e hash estável apesar da ordem das chaves.
- Esta medição sintética não substitui medir os pedidos reais após o gateway/serializador estar ligado aos writers. Guards de abas inteiras podem consumir grande parte ou exceder o teto de 1,5 MiB; nenhuma medição com dados reais foi feita.

## Verificações locais — atualização 16/10/2026

- Execução real desta continuação (posterior às contagens históricas abaixo): `npm test -- --maxWorkers=1` — passou, 48 arquivos/332 testes; `npm run lint` — passou; `npm run build` — passou; `node --check apps-script/gateway/Code.js` — passou; `git diff --check` — passou. O build reescreveu temporariamente `next-env.d.ts`; a referência de desenvolvimento registrada no estado inicial foi reaplicada manualmente, sem restaurar arquivos por Git.
- As contagens de 299, 310, 318 e 331 testes nos registros históricos abaixo foram superadas pela execução de 332 testes acima.

- Continuação de autorização de writers: testes direcionados de criação de atas, grupos, usuários, ações e gateway passaram (7 arquivos/87 testes). Casos do `Code.js` cobrem administrador/responsável, escopo ativo, criação autenticada e por link público, token de ativação válido/inválido, campos de grupo permitidos e autorização de writers de grupo.
- Bateria final após as alterações: `npm test -- --maxWorkers=1` passou, 48 arquivos e 331 testes; `npm run lint` passou; `npm run build` passou; `node --check apps-script/gateway/Code.js` passou; `git diff --check` passou.
- O build alterou `next-env.d.ts`, que já estava modificado antes da bateria. O conteúdo original pré-validação foi preservado byte a byte; nenhuma outra alteração preexistente foi restaurada ou removida.
- Teste direcionado após a regra de autorização do índice: `npm test -- --maxWorkers=1 apps-script/gateway/Code.test.ts src/app/atas/actions.test.ts src/lib/sheets/ata-admin.test.ts` passou, 3 arquivos/27 testes.
- `npm test -- --maxWorkers=1 apps-script/gateway/Code.test.ts src/lib/sheets/gateway-client.test.ts`: passou, 2 arquivos e 22 testes.
- Após ampliar os casos de consulta/reconciliação: o mesmo teste direcionado passou com 2 arquivos e 23 testes.
- `npm test -- --maxWorkers=1 apps-script/gateway/Code.test.ts src/lib/sheets/create-simulated-atas.test.ts`: passou, 2 arquivos e 24 testes.
- `npm test -- --maxWorkers=1`: passou na continuação local anterior à implementação da consulta de status: 48 arquivos e 310 testes.
- Bateria final após consulta assinada de status: `npm test -- --maxWorkers=1` passou, 48 arquivos e 318 testes.
- `npm run lint`: passou.
- Bateria final: `npm run lint` passou sem avisos.
- `node --check apps-script/gateway/Code.js`: passou.
- `git diff --check`: passou.
- `npm run build`: passou; compilação, TypeScript e geração de páginas concluídos. O build não alterou `next-env.d.ts`.
- Bateria final: `npm run build`, `node --check apps-script/gateway/Code.js` e `git diff --check` passaram; `next-env.d.ts` permaneceu inalterado.

## Bloqueios para CP-01

- O Gateway v2 estava implantado e respondeu a uma operação assinada real. Esta execução não alterou propriedades nem deployment; quotas e comparação integral de configurações ainda não foram auditadas.
- Houve uma gravação no-op de teste e leitura pós-escrita na planilha compartilhada, conforme o registro abaixo. O alvo afeta DEV e PROD; a decisão/autorização do usuário está registrada no checklist.
- O corte de escritores externos permanece aberto: deployments antigos, edição manual e scripts externos não foram suspensos nem coordenados. As rotinas de reconciliação, proteções e reset precisam ser bloqueadas durante a janela.
- A revalidação local cobre os writers de negócio descritos acima; a operação real validou apenas `atualizar_indice_ata` em caso no-op. `GATEWAY_ADMIN_EMAILS` não foi comparada integralmente com `AUTH_ALLOWED_EMAILS`; quotas, demais capacidades e corte continuam pendentes.
- O cliente consulta o ledger após falha de transporte/resposta e só reconhece sucesso quando encontra o mesmo ID/hash concluído. Ausência, conflito, indisponibilidade ou estado não concluído falham fechados e não disparam retry. Recuperação manual após estado inconclusivo e comprovação de encerramento da chamada original precisam de demonstração operacional.
- Medir payload representativo/real com guards completos e fechar o corte de deployments antigos, edição manual e scripts externos seguem pendentes. Testes sintéticos não provam capacidade do gateway implantado nem payload real.
- Esses itens impedem demonstrar todos os critérios de prontidão operacional. CP-01 não está apresentado como aceito; a implementação local da F2 pode começar conforme decisão registrada no checklist.

## Gravação controlada e leitura posterior — 16/10/2026

- **Alvo reconfirmado:** `GS Mapeamento | DEV`, planilha compartilhada por DEV/PROD. O alvo tinha 12 abas e `operacoes` com o cabeçalho aprovado; o backup pré-escrita tinha 11 abas. Nenhuma restauração foi feita.
- **Operação:** `operacao_id` `983d2436-40ae-4259-bab1-eda9e656c1b1`; tipo `atualizar_indice_ata`; atualização A:D de uma linha já existente com os mesmos valores tipados lidos imediatamente antes. Guard SHA-256 do intervalo enviado foi validado pelo Gateway. Sem valores de negócio registrados neste documento.
- **Resposta do Gateway:** HTTP 200; `ok: true`, `existing: false`, `resultado_ref` igual ao `operacao_id`.
- **Confirmação no ledger:** consulta assinada HTTP 200 retornou `state: aplicada` e `safe_to_retry: false`. A leitura de `operacoes` encontrou exatamente uma linha para o ID, com hash correspondente, estado `concluida`, tipo `atualizar_indice_ata` e `resultado_ref` igual ao ID.
- **Leitura pós-escrita:** A:D manteve os mesmos valores e tipos (`string`, `number`, `number`, `string`) do pré-voo; nenhuma diferença foi encontrada. Não houve retry nem segunda gravação.
- **Interpretação e limite:** isso comprova um caso mínimo de mutação atômica no-op mais ledger e readback no runtime implantado. Não prova mutação de negócio com mudança de valor, teste em planilha isolada, recuperação/retorno, coordenação de outros writers, payload representativo ou segurança completa da planilha compartilhada. CP-01 permanece não aceito para operações reais; a implementação local da F2 começou sem escrita em Sheets.
