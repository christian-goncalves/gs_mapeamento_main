# Diagnóstico: contrato da aba de horários e persistência de campos

## Objeto da investigação

Investigar por que horários de domingo e segunda-feira continuam aparecendo na aba `grupo_horarios` depois de o usuário excluí-los pela interface, identificar o campo de término no contrato e distinguir esses comportamentos do erro genérico de carregamento mostrado anteriormente.

## Contexto

O usuário excluiu pela interface os horários de domingo e segunda-feira. Na captura da planilha, esses registros continuam presentes com `ativo = FALSE`, enquanto os horários de terça a sábado aparecem com `ativo = TRUE`. O cabeçalho informado pelo usuário é `horario_id, grupo_id, dia_semana, hora_inicio, link_reuniao, ativo, created_at, updated_at, plataforma_id` e não contém `hora_termino`.

As alterações locais existentes foram preservadas. A instrução do `AGENTS.md` aponta para `/home/cg/Documentos/01-DEV/PROJETOS/Apps/02-GS_Mapeamento/docs/`, mas esse diretório não existe neste ambiente. Foram consultados o `docs/README.md` e as fontes do checkout atual.

## Evidências examinadas

- Captura mais recente enviada pelo usuário: `/grupos/8806319f-ddd2-4b67-9416-ab42bb991870`, com “Não foi possível carregar os grupos” e botão “Tentar novamente”. Não mostra PDF, stack trace ou erro de rede.
- Captura da planilha enviada pelo usuário: linhas de domingo (10:30, 18:00, 21:30) e segunda-feira (07:30, 10:00, 15:00, 21:30) persistem com `ativo = FALSE`; linhas de terça a sábado estão com `ativo = TRUE`.
- Cabeçalho da aba `grupo_horarios` informado pelo usuário: `horario_id`, `grupo_id`, `dia_semana`, `hora_inicio`, `link_reuniao`, `ativo`, `created_at`, `updated_at`, `plataforma_id`; não inclui `hora_termino`.
- Captura do editor enviada pelo usuário: arquivo `src/lib/pdf/monthly-report-pdf-document.tsx` aberto com sublinhados vermelhos sob várias expressões JSX e `style`.
- Captura posterior do Explorador enviada pelo usuário: `monthly-report-pdf-document.tsx` aparece na árvore de `src/lib/pdf` sem decoração vermelha visível.
- Captura anterior enviada pelo usuário: tabela “Horários de Reunião”, com domingo e segunda sem horários visíveis e horários visíveis nos outros dias.
- `src/app/grupos/error.tsx:3-20`: error boundary da seção que exibe o texto genérico para qualquer exceção não tratada na rota.
- `src/app/grupos/[grupoId]/page.tsx:19-40`: a página carrega dados agregados, procura o grupo, obtém token do link e filtra horários/plataformas/servidores antes de renderizar o editor.
- `src/lib/auth/require-session.ts:20-29,50-54`: o carregamento dessa rota chama `readAggregatedAtas()` antes de autorizar o acesso ao grupo.
- `src/lib/sheets/repository.ts:127-195,420-505`: o carregador lê várias abas e agrega linhas; erros da API do Sheets que não sejam de aba ausente são relançados. Horários vazios são fornecidos ao agregador como lista vazia.
- `src/domain/aggregate.ts:112-141,296-305`: o agregador aceita `grupo_horarios` vazio; não exige horário para incluir um grupo.
- `src/lib/sheets/contract.ts:12-15`: o contrato-base de `grupo_horarios` contém os oito campos legados e termina em `updated_at`.
- `src/lib/sheets/contract-v2.ts:4-7,126-128`: as extensões compatíveis são `plataforma_id` e depois `hora_termino`, anexadas ao final do cabeçalho-base.
- `src/domain/schemas.ts:73-85`, `src/lib/sheets/schemas.ts:174-184` e `src/domain/form-schemas.ts:48-64`: `hora_termino` já está nos esquemas de domínio, leitura da planilha e formulário; é opcional e validado como horário.
- `src/lib/sheets/group-admin.ts:490-497,544-579`: ao salvar um término preenchido, o serviço exige que exista a coluna `hora_termino`; caso contrário, lança `A coluna hora_termino ainda não existe em grupo_horarios.`. A escrita usa os cabeçalhos presentes.
- `src/lib/sheets/contract-reconciliation.ts:802-845`: o contrato compatível define as extensões esperadas e a rotina de reconciliação pode anexar as colunas ausentes ao final, preservando o prefixo existente.
- `src/app/grupos/group-schedules-editor.tsx:353-357,646-664`: a confirmação visual “Excluir horário” envia `ativo=false` e chama `toggleHorarioAction`.
- `src/app/grupos/actions.ts:647-660`: `toggleHorarioAction` atualiza o registro existente chamando `saveGrupoHorario` com `ativo` alterado.
- `src/lib/sheets/group-admin.ts:779-805`: existe também uma operação distinta, `deleteGrupoHorarios`, que remove fisicamente as linhas selecionadas da aba.
- `src/app/grupos/actions.ts:101-114,621-645` e `src/lib/sheets/group-admin.ts:470-487`: o salvamento do conjunto exige ao menos um horário (`.min(1)` e validação correspondente no serviço).
- Verificação local `./node_modules/.bin/tsc --noEmit --incremental false --pretty false`: registrou 11 erros `TS2769` em `src/lib/pdf/monthly-report-pdf-document.tsx` (linhas 75, 84, 86, 89, 90, 92, 114, 124, 128 e 130; há duas ocorrências na linha 92). A saída detalhada da linha 75 informa que estilos condicionais tipados como objeto ou `null` não são atribuíveis ao tipo `Style` esperado por `@react-pdf/renderer`. A mesma execução também apontou erros de tipagem em outros arquivos do repositório, especialmente fixtures/testes; testes não foram executados.
- `src/lib/pdf/monthly-report-pdf-document.tsx:107-139,193-243` e `src/app/relatorios/monthly-group-dashboard-data.ts:300-349,351-403`: o PDF percorre resultados em arrays; dia sem horário não causa exceção evidente. Sem horários, o relatório pode ficar sem essas linhas, e consolidados esperados podem ficar zerados.
- `src/app/api/relatorios/mensal/pdf/route.ts:27-46`: o endpoint só gera o PDF depois de carregar e agregar dados, validar filtros e grupo.
- `git status --short`: há alterações locais em arquivos `src`, incluindo `group-schedules-editor.tsx`, `actions.ts`, `group-admin.ts` e `monthly-report-pdf-document.tsx`; elas foram apenas examinadas, sem alteração nesta investigação.

## Estado observado

- A planilha contém sete linhas de domingo e segunda com `ativo = FALSE`; os horários ativos dos outros dias continuam registrados.
- A interface deixa de mostrar os horários que foram desativados porque a lista `activeRows` filtra `horario.ativo`.
- O botão exibido como “Excluir horário” desativa a linha; ele não chama a operação que remove linhas da planilha.
- `hora_termino` está ausente do cabeçalho informado, embora seja aceito pela interface e pelo domínio.
- Segundo a ordem contratual, `hora_termino` deve ser uma extensão após `plataforma_id` (coluna J na disposição informada), sem remover ou deslocar `link_reuniao`.
- Quando o formulário envia um término sem essa coluna, a rotina de salvamento interrompe a gravação com erro explícito.
- A verificação de tipos atual reproduz erros no PDF mensal: 11 ocorrências `TS2769`, principalmente porque arrays de estilos incluem `null` em ramificações condicionais.
- A captura posterior do Explorador não mostra decoração vermelha no nome do arquivo; isso não contradiz os erros reproduzidos pela verificação de tipos, pois a captura não mostra o painel Problems nem o editor com os sublinhados.
- A mensagem genérica de carregamento foi observada em captura anterior, mas não inclui stack trace, digest ou erro de rede. A captura da planilha não mostra falha de PDF.
- O modelo agregado aceita lista vazia de horários, mas salvar um conjunto com zero itens continua bloqueado pela validação.

## Análise

A interface chama “Excluir” uma ação que envia `ativo=false`. A server action encaminha esse valor para `saveGrupoHorario`, que grava a mesma linha com o campo `ativo` atualizado. Isso coincide com os valores da captura: os horários de domingo e segunda aparecem na planilha, mas estão inativos. A lista da tela é formada somente por registros ativos, então eles desaparecem da visualização sem desaparecer da planilha.

O repositório possui uma operação de exclusão física (`deleteGrupoHorarios`), mas o formulário de confirmação examinado não a utiliza. Assim, o comportamento observado é explicado pela diferença entre desativar e excluir. Separadamente, a operação de salvar o conjunto não permite que ele fique com zero linhas.

O contrato-base tem oito colunas e as extensões V2 são ordenadas como `plataforma_id` e `hora_termino`. O cabeçalho fornecido pelo usuário contém `plataforma_id`, mas não `hora_termino`. A interface, o formulário, a entidade e o parser já aceitam o campo de término; ao salvar um valor não vazio, `saveGrupoHorarioSet` verifica se o cabeçalho existe e lança o erro explícito quando está ausente. Isso corresponde à falha relatada ao preencher hora de término.

`link_reuniao` continua fazendo parte do cabeçalho-base. Removê-lo ou movê-lo não é necessário para incluir o campo novo e poderia quebrar o mapeamento legado. A posição definida pelo contrato para `hora_termino` é depois de `plataforma_id`.

O PDF mensal é outro fluxo. Horários inativos são ignorados pelo cálculo de agendas ativas; a captura não demonstra falha na renderização do PDF. O erro genérico observado anteriormente continua sem causa operacional identificada porque não há log ou resposta de rede.

Separadamente, o arquivo `monthly-report-pdf-document.tsx` tem problemas de tipagem reproduzidos pela execução atual: arrays de estilos incluem `null` em condições, mas `@react-pdf/renderer` espera itens compatíveis com `Style`. Isso explica os sublinhados vermelhos vistos na captura do editor; a ausência de decoração no nome do arquivo na árvore do Explorador não demonstra que esses diagnósticos tenham sido corrigidos.

O texto do error boundary sugere revisar a conexão com a base de dados, mas não identifica a exceção real. O armazenamento do projeto é acessado via Google Sheets; sem logs do servidor ou resposta de rede, não é possível atribuir aquela mensagem genérica à desativação dos horários.

## Hipóteses avaliadas

- **As linhas foram excluídas fisicamente pela ação da interface:** descartada; o código chama a ação de alternância e a planilha mostra as mesmas linhas com `ativo = FALSE`.
- **A interface desativa os horários em vez de removê-los:** confirmada pelo fluxo do botão, server action e valores da planilha.
- **O salvamento da hora de término falha porque falta `hora_termino` no cabeçalho:** confirmado pelo cabeçalho informado e pela validação explícita no serviço.
- **`hora_termino` deve substituir ou deslocar `link_reuniao`:** descartada pelo contrato; a nova coluna é uma extensão final.
- **O arquivo do PDF tem erros de TypeScript ativos:** confirmada pela execução atual de `tsc`, com 11 erros `TS2769` na lista de estilos que admite `null`.
- **A ausência da decoração vermelha no Explorador prova que os erros foram corrigidos:** não sustentada; a árvore não exibe os diagnósticos sem abrir o editor ou o painel Problems, e o TypeScript ainda os reproduz.
- **A desativação causou a mensagem genérica de carregamento:** não sustentada; a página e o agregador toleram horários ausentes/inativos, e falta o erro original do servidor.
- **Falha específica do PDF:** não sustentada; a captura atual é da planilha e a captura anterior do erro era da configuração do grupo.

## Diagnóstico

A ação chamada “Excluir horário” apenas altera `ativo` para `FALSE`; por isso, os horários de domingo e segunda continuam como linhas na planilha, embora deixem de aparecer na lista ativa. O erro relatado ao salvar hora de término é explicado pela ausência da coluna `hora_termino`: o campo já existe no formulário e no esquema, mas o serviço bloqueia a gravação se a coluna não estiver no cabeçalho. Pelo contrato, ela deve ser anexada após `plataforma_id` — coluna J na ordem informada —, mantendo `link_reuniao` no lugar. Separadamente, `monthly-report-pdf-document.tsx` tem 11 erros de tipagem `TS2769` reproduzidos pela verificação atual. A mensagem genérica de carregamento anterior permanece sem causa operacional identificada.

## Grau de certeza

Alto quanto às linhas de horários permanecerem na planilha, à ausência de `hora_termino` no cabeçalho informado e à causa explícita do erro de gravação; as evidências do código e da planilha se correspondem. Alto também quanto aos erros de tipagem do PDF, reproduzidos pelo compilador. Baixo quanto à causa operacional da tela genérica de carregamento anterior, pois faltam logs e dados da requisição que falhou.

## Pontos ainda não comprovados

- A mensagem/stack trace real do servidor e o digest da exceção que produziu a tela genérica.
- Se a aba `grupo_horarios` e as demais abas do Sheets estavam disponíveis no momento daquela falha.
- Se o editor/serviço TypeScript estava exibindo uma versão de diagnósticos desatualizada quando a decoração vermelha deixou de aparecer na árvore; a captura atual da árvore não contém informação suficiente para determinar isso.
- O que o usuário quis dizer pelos “pontos em vermelho” em `src`; não foi fornecida captura do editor/Problems nem a identificação de arquivos/diagnósticos.
- Se a coluna `hora_termino` já foi acrescentada à planilha depois da captura do cabeçalho.
