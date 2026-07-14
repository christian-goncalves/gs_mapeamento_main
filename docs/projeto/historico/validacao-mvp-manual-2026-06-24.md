# Validacao Manual do MVP

## Objetivo

Validar o MVP funcionalmente, com foco em formulario, filtros, persistencia no
Google Sheets e ajustes visuais. Esta rodada nao altera autorizacao avancada,
UCell, hardening de seguranca ou regra de negocio.

## Estado do Repositorio

Diagnostico em 2026-06-24:

- `git status --short`: limpo, sem arquivos alterados ou nao rastreados antes
  desta documentacao.
- Estrutura principal: Next.js App Router em `src/app`, dominio em
  `src/domain`, adaptador Google Sheets em `src/lib/sheets`, documentacao em
  `docs`.
- Persistencia oficial: Google Sheets, sem banco local.
- Scripts disponiveis:
  - `npm run dev`
  - `npm run build`
  - `npm run start`
  - `npm run lint`
  - `npm test`
  - `npm run municipios:update`
  - `npm run sheets:reconcile-contract`
  - `npm run sheets:reconcile-protections`
- Dependencias principais: `next`, `react`, `next-auth`, `googleapis`, `zod`.
- Dependencias de desenvolvimento: `typescript`, `vitest`, `eslint`, `tsx`.

Validacao automatizada local executada:

- `npm test`: 15 arquivos, 97 testes aprovados.
- `npm run lint`: aprovado.
- `npm run build`: aprovado. O build confirmou uso de `.env.local`.

Riscos imediatos antes dos testes manuais:

- Testes reais escrevem na planilha definida por `GOOGLE_SHEETS_ID` em
  `.env.local`. Confirmar se ela e DEV ou PROD antes de preencher dados.
- A aplicacao nao cria grupos pela UI; o grupo usado no teste precisa existir
  e estar ativo na aba `grupos`.
- A plataforma atual da UI e `Zoom`, nao `Online`.
- A UI atual exige pelo menos um formato de reuniao antes de revisar.
- Servidores adicionados possuem nome obrigatorio; uma linha vazia deve bloquear
  o envio.
- `visitantes.categoria` e `visitantes.origem_contato` ficam ocultos no
  formulario e sao persistidos como `Outro`.
- `tempo_limpo` aceita os codigos atuais: `1M`, `2M`, `3M`, `6M`, `9M`,
  `12M`, `18M`, `MULTIPLOS_ANOS`.

Arquivos que exigem atencao antes dos testes:

- `.env.local`: confirmar planilha alvo e URLs locais.
- `.env.example`: alinhar variaveis de Auth presentes no local, se forem
  obrigatorias para o ambiente.
- `src/app/atas/nova/ata-form.tsx`: superficie principal dos testes manuais.
- `src/app/atas/nova/municipio-autocomplete.tsx`: filtro cidade/estado.
- `src/lib/sheets/create-ata.ts`: escrita real no Google Sheets.
- `src/lib/sheets/contract.ts`: abas e cabecalhos esperados.

## Diagnostico dos .env

Arquivos encontrados:

- `.env.example`: contrato versionado sem valores secretos.
- `.env.local`: valores locais reais, ignorado pelo Git.
- Nao existe `.env` no repositorio.

Variaveis em `.env.example`:

- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_ALLOWED_EMAILS`
- `GOOGLE_SHEETS_ID`
- `GOOGLE_SHEETS_TEST_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `MANUAL_SHEETS_EDIT_ENABLED`

Variaveis em `.env.local`:

- `GOOGLE_SHEETS_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_ALLOWED_EMAILS`
- `AUTH_URL`
- `NEXTAUTH_URL`
- `AUTH_TRUST_HOST`

Faltando no `.env.example`, mas presentes no `.env.local`:

- `AUTH_URL`
- `NEXTAUTH_URL`
- `AUTH_TRUST_HOST`

Presentes no `.env.example`, mas ausentes no `.env.local`:

- `GOOGLE_SHEETS_TEST_ID`
- `MANUAL_SHEETS_EDIT_ENABLED`

Duplicidades e obsolescencia aparente:

- Nao foram encontradas chaves repetidas dentro de um mesmo arquivo.
- As variaveis comuns entre `.env.example` e `.env.local` sao esperadas.
- `AUTH_URL` e `NEXTAUTH_URL` podem ser redundantes dependendo da versao do
  Auth.js/NextAuth usada no runtime. Manter ambas por enquanto se o login local
  esta funcionando.
- `GOOGLE_SHEETS_TEST_ID` existe no contrato, mas a aplicacao usa
  `GOOGLE_SHEETS_ID` em desenvolvimento e na escrita real.
- `MANUAL_SHEETS_EDIT_ENABLED` e usada somente na rotina administrativa de
  protecoes, nao no fluxo normal de criacao de ata.

Arquivo usado em desenvolvimento local:

- O Next.js carrega `.env.local` em `npm run dev` e no build local. O build de
  2026-06-24 exibiu explicitamente `Environments: .env.local`.
- Os scripts `sheets:reconcile-contract` e `sheets:reconcile-protections`
  tambem carregam `.env.local` via `tsx --env-file=.env.local`.

Sugestao simples e segura:

- Manter `.env.local` como unico arquivo local com segredos.
- Manter `.env.example` sem valores reais.
- Adicionar ao `.env.example` as variaveis de URL/Auth que forem necessarias no
  setup local: `AUTH_URL`, `NEXTAUTH_URL`, `AUTH_TRUST_HOST`.
- Definir explicitamente `MANUAL_SHEETS_EDIT_ENABLED=true` em `.env.local` se a
  rotina de protecoes for usada.
- Antes do teste manual, confirmar se `GOOGLE_SHEETS_ID` aponta para DEV.
- Nao copiar valores reais para documentacao, commits ou tickets.

## Base de Dados

O MVP usa Google Sheets como base oficial. As abas esperadas sao:

- `grupos`
- `atas`
- `servidores`
- `participacao`
- `visitantes`
- `ingressos`
- `trocas_chaveiro`

Limpeza verificada em 2026-06-24 na planilha DEV:

- URL verificada:
  `https://docs.google.com/spreadsheets/d/1oHQ_VgwlRHEEUZP5gXyUX8RiGz0hEEZebHUhXiy1imU/edit`
- Titulo: `GS Mapeamento | DEV`.
- Abas encontradas: `grupos`, `atas`, `servidores`, `participacao`,
  `visitantes`, `trocas_chaveiro` e `ingressos`.
- As abas de registros `servidores`, `participacao`, `visitantes`,
  `ingressos` e `trocas_chaveiro` estao somente com cabecalho no range
  verificado.
- A aba `atas` esta sem registros de negocio; ha linhas vazias preservando
  checkboxes `FALSE` nas colunas de formatos.
- Cabecalhos e linha congelada foram preservados nas sete abas.
- Checkboxes da aba `atas` foram preservados nas colunas de formatos.
- Listas suspensas foram preservadas em `atas.plataforma` e
  `atas.tipo_reuniao`.

Validacao de `trocas_chaveiro` reconciliada em 2026-06-24:

- Comando aplicado na planilha DEV:
  `GOOGLE_SHEETS_ID=1oHQ_VgwlRHEEUZP5gXyUX8RiGz0hEEZebHUhXiy1imU npm run sheets:reconcile-contract`
- Resultado: `createdSheets=[]`, `addedColumns=[]`,
  `appliedRequestCount=4`.
- `trocas_chaveiro!C2:C20` foi verificada com dropdown estrito para os codigos
  atuais: `1M`, `2M`, `3M`, `6M`, `9M`, `12M`, `18M`,
  `MULTIPLOS_ANOS`.
- `trocas_chaveiro!D2:D20` foi verificada com validacao numerica
  `NUMBER_GREATER_THAN_EQ` e valor minimo `1`, sem dropdown de tempo limpo.
- A garantia de inteiro permanece no backend pelos schemas da aplicacao.

Estrategia segura para limpeza antes dos testes:

1. Confirmar que `GOOGLE_SHEETS_ID` aponta para a planilha de DEV/teste.
2. Fazer backup ou duplicar a planilha antes de qualquer limpeza.
3. Preservar a aba `grupos`, pois ela contem os grupos ativos usados pelo
   formulario.
4. Preservar a linha 1 de cabecalho em todas as abas.
5. Limpar somente as linhas de dados, a partir da linha 2, nas abas:
   `atas`, `servidores`, `participacao`, `visitantes`, `ingressos` e
   `trocas_chaveiro`.
6. Reabrir a aplicacao e confirmar que a home mostra grupos ativos e nenhuma
   ata valida cadastrada.
7. Executar o primeiro cadastro minimo e conferir as linhas novas em cada aba.

Nao limpar dados de producao sem uma confirmacao explicita do usuario.

## Roteiro de Testes

### Teste 1 - Cadastro minimo

Pre-condicoes:

- Usar um grupo ativo existente. Se `Grupo Teste MVP 01` nao existir, criar ou
  ativar esse grupo manualmente na aba `grupos` antes do teste.
- Selecionar pelo menos um formato de reuniao.
- Usar plataforma atual da aplicacao: `Zoom`.

Dados:

- Grupo: `Grupo Teste MVP 01`
- Cidade/localidade: `Itajai - SC`
- Estado: derivado como `SC`
- Pais: derivado como `Brasil`
- Data da reuniao: data atual
- Plataforma: `Zoom`
- Tipo: `Aberta`
- Total de membros presentes: `3`
- Total de partilhas: `1`

Validar:

- Salvou sem erro.
- Redirecionou para o detalhe da ata.
- Criou linha em `atas`.
- Criou IDs UUID corretamente.
- Preencheu `created_at` e `updated_at`.
- Dados escalares aparecem na aba `atas`.
- Se houver localidade adicionada, ela aparece em `participacao` com o mesmo
  `ata_id`.

### Teste 2 - Filtro de cidade/estado

Testar:

- Digitar `Ita` e selecionar `Itajai - SC`.
- Digitar `Blu` e selecionar `Blumenau - SC`.
- Digitar cidade inexistente.

Validar:

- Busca responde rapidamente.
- Sugestoes aparecem sem travamento.
- Selecionar uma sugestao preenche o campo em formato `Nome - UF`.
- Cidade inexistente nao deve passar na validacao do backend.
- Nenhum estado errado e persistido.

### Teste 3 - Participacoes

Inserir:

- `Itajai - SC` com `2` presencas.
- `Navegantes - SC` com `1` presenca.

Validar:

- Criacao de linhas em `participacao`.
- Vinculo correto com `ata_id`.
- `localidade`, `estado`, `pais` e `presencas` persistidos corretamente.
- Soma coerente com `total_membros_presentes`.

### Teste 4 - Visitantes

Inserir:

- `Ana`, cidade `Itajai - SC`.
- `Joao`, cidade `Navegantes - SC`.

Validar:

- Criacao de linhas em `visitantes`.
- Vinculo correto com `ata_id`.
- `categoria` e `origem_contato` persistem como `Outro` pela modelagem hidden
  atual.
- Nome vazio, quando usado, persiste como `Anonimo`.
- Interface nao fica confusa ao adicionar/remover linhas.

### Teste 5 - Trocas de ficha

Inserir:

- `1M` para representar 30 dias.
- `12M` para representar 1 ano.
- `MULTIPLOS_ANOS` para multiplos anos.

Validar:

- Criacao de linhas em `trocas_chaveiro`.
- Vinculo correto com `ata_id`.
- `tempo_limpo` e `quantidade` persistidos corretamente.

### Teste 6 - Servidores

Inserir:

- `Christian`
- `Maria`
- `Jose`

Validar:

- Criacao de linhas em `servidores`.
- Campo vazio nao deve ser mantido como quarta linha; se uma quarta linha vazia
  for adicionada, o formulario deve bloquear o envio.
- Ordem dos servidores persiste coerente com a ordem visual.

### Teste 7 - Formulario completo

Preencher todos os campos disponiveis com dados controlados:

- Informacoes gerais.
- Servidores.
- Localidade - Cidades (UF).
- Visitantes.
- Ingressos.
- Troca de ficha.

Validar:

- Tempo de envio.
- Feedback visual durante envio.
- Redirecionamento para detalhe.
- Mensagem de erro se houver falha.
- Estado do formulario depois de salvar.
- Consistencia entre detalhe da ata e linhas no Sheets.

### Teste 8 - Erros simples

Testar:

- Formato de reuniao nao selecionado.
- Campo obrigatorio vazio.
- Numero invalido.
- Cidade digitada mas nao selecionada.
- Envio duplo rapido no modal.
- Recarregar pagina no meio do preenchimento.

Validar:

- Mensagens claras.
- Ausencia de crash.
- Nenhum dado quebrado no Sheets.
- Confirmacao desabilita durante envio.
- Rascunho nao e persistido se a pagina for recarregada.

## Resultado dos Testes

Resultado atual:

- Validacao automatizada local: aprovada.
- Validacao manual funcional com escrita real no Google Sheets: pendente.
- Limpeza de base DEV: verificada por leitura direta da planilha
  `GS Mapeamento | DEV`.
- Reconciliacao DEV de `trocas_chaveiro`: aplicada e verificada.
- Validacoes locais pos-correcao: `npm test`, `npm run lint` e
  `npm run build` aprovados.
- A home havia exibido diagnosticos em `Correcoes necessarias no Sheets`,
  isolando linhas antigas da aba `ingressos` que nao participavam dos
  indicadores.
- Diagnosticos exibidos antes da limpeza:
  - `ingressos`, linha `2`, campo `cidade`: `Campo obrigatorio.`
  - `ingressos`, linha `2`, campo `cidade`: `Municipio inexistente.`
  - `ingressos`, linha `3`, campo `cidade`: `Campo obrigatorio.`
  - `ingressos`, linha `3`, campo `cidade`: `Municipio inexistente.`
  - `ingressos`, linha `4`, campo `cidade`: `Campo obrigatorio.`
  - `ingressos`, linha `4`, campo `cidade`: `Municipio inexistente.`
  - `ingressos`, linha `5`, campo `cidade`: `Campo obrigatorio.`
  - `ingressos`, linha `5`, campo `cidade`: `Municipio inexistente.`
- Apos a limpeza, a aba `ingressos` foi verificada somente com cabecalho.

## Ajustes Visuais Identificados

- A label `Localidade - Cidades (UF)` e tecnica; pode ser simplificada para o
  usuario final.
- Campo `Plataforma` aparece desabilitado como `Zoom`; avaliar se deve virar
  texto informativo em vez de select desabilitado.
- O fluxo exige clicar em `Adicionar cidade`, `Adicionar visitante`, etc.;
  testar se o usuario entende que precisa criar as linhas antes de preencher.
- Botao `Remover` usa texto grande em linhas repetidas; em mobile pode ocupar
  espaco demais.
- Setas `↑` e `↓` funcionam, mas podem nao ser obvias para todos os usuarios.
- O resumo usa o texto `Confirmar envio imutavel`, correto tecnicamente, mas
  pode soar pesado para uso comum.
- O autocomplete mostra `Buscando...`, mas nao mostra mensagem explicita quando
  nao ha resultado.
- Erros do backend aparecem como texto unico; validar se o campo problematico
  fica claro para usuarios nao tecnicos.
- Em telas pequenas, os blocos viram uma coluna; testar modal com formulario
  completo para verificar rolagem e botoes fixos.
- O formulario nao mostra contadores resumidos fora do modal; avaliar se isso
  ajudaria em reunioes longas.

## Bugs Encontrados

Nenhum bug bloqueador foi confirmado por execucao automatizada local.

Diagnostico funcional observado na interface:

- A aba `ingressos` possui registros nas linhas `2`, `3`, `4` e `5` com
  `cidade` vazia ou invalida.
- A aplicacao isolou essas linhas corretamente e informou `Campo obrigatorio.`
  e `Municipio inexistente.`.
- Causa provavel: registros antigos ou dados de teste criados antes da exigencia
  de `ingressos.cidade` no contrato ATA Full.
- Correcao aplicada/verificada: as linhas de dados da aba `ingressos` foram
  removidas na planilha DEV, preservando o cabecalho.

Diagnostico funcional observado na planilha e corrigido:

- `trocas_chaveiro!C:C` tinha dropdown de tempo limpo com rotulos antigos
  (`30 dias`, `60 dias`, `90 dias`, `6 meses`, `9 meses`, `1 ano`,
  `18 meses`, `Multiplos anos`).
- `trocas_chaveiro!D:D`, coluna `quantidade`, tinha dropdown de tempo limpo.
- Correcao aplicada: o reconciliador estrutural passou a aplicar dropdown de
  codigos atuais em `tempo_limpo` e validacao numerica minima em `quantidade`.
- Verificacao pos-correcao: `trocas_chaveiro!C2:C20` aceita
  `1M`, `2M`, `3M`, `6M`, `9M`, `12M`, `18M`, `MULTIPLOS_ANOS`;
  `trocas_chaveiro!D2:D20` aceita numero maior ou igual a `1`.

Possiveis desalinhamentos para observar no teste manual:

- Roteiro inicial citava plataforma `Online`, mas a aplicacao aceita apenas
  `Zoom`.
- Roteiro inicial citava `servidor_4` vazio; a UI atual deve bloquear linha de
  servidor vazia se ela existir.
- Roteiro inicial citava visitante como categoria `visitante`; a UI atual oculta
  categoria e persiste `Outro`.
- Roteiro inicial citava `30 dias` e `1 ano`; o contrato atual usa `1M` e
  `12M`.

## Proximo Tiro

Pausa operacional definida em 2026-06-24:

- Tratar o estado atual como MVP para teste inicial.
- Nao implementar as novas ideias do backlog agora.
- Ao retomar em outra janela, iniciar pela validacao do MVP atual e avisar:
  `Christian, antes de mexer em novas features, precisamos verificar as
  pendencias registradas e validar o MVP atual.`
- Ideias surgidas durante o teste ficam registradas em
  [Backlog de produto](../../produto/backlog.md) ate virarem plano aprovado.

Proximo passo:

1. Executar os testes manuais de cadastro minimo, autocomplete e formulario
   completo.
2. Registrar evidencias por `ata_id`, linhas criadas e diagnosticos exibidos.
3. Ajustar somente textos/labels/feedback que bloquearem ou atrapalharem o
   teste manual.
4. Depois disso, retomar testes de autorizacao, duplicidade, duplo clique e
   seguranca.
