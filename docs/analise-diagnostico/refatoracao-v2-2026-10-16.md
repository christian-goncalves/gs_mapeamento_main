# Diagnóstico da demanda de refatoração V2 de 16/10/2026

## Objeto da investigação

Confrontar as solicitações da pasta `docs/.refatoracao-marcos/refatoracao_v2_2026-10-16/` com o comportamento atual do GS Mapeamento e identificar dependências e decisões de produto necessárias para uma futura refatoração em camadas. Este registro é investigativo: não constitui plano executivo nem autorização de implementação.

## Contexto

- Checkout analisado: `/home/cg/Documentos/01-DEV/PROJETOS/gs-mapeamento`, branch `main`, HEAD `06d74da`.
- Inspeção realizada em 16/10/2026. Não foi comprovado nesta investigação que o deploy corresponde exatamente a esse commit; código local e produção são evidências distintas.
- Google Sheets é a persistência oficial; nenhuma escrita de negócio, reconciliação, envio ou exclusão foi executada.
- O worktree já continha exclusões de documentos/mídias antigos e a pasta `.refatoracao-marcos/` não rastreada. Essas alterações foram preservadas.
- A referência absoluta de diretrizes em `AGENTS.md` aponta para outro checkout e não estava disponível. Foram lidas as diretrizes existentes em `docs/desenvolvimento/diretrizes-agentes.md` deste checkout, além de `README.md` e `docs/README.md`.
- A nota histórica de pausa do MVP pertence a um checkout anterior. Não comprova um bloqueio vigente neste checkout. O checklist atual ainda mistura tarefas concluídas e pendentes de validação; não foi tomado como prova de comportamento em produção.
- O usuário confirmou que o administrador está em outro navegador e que usar a mesma conexão exigiria logout/login. A sessão de responsável foi preservada; inspeção administrativa ao vivo permanece pendente.

## Evidências examinadas

### Fontes escritas e técnicas

- `_chat.txt` da pasta V2, integralmente: solicitações de setembro e outubro de 2026. Um trecho contém credencial; seu conteúdo foi excluído deste documento e não foi usado para autenticação.
- `docs/desenvolvimento/diretrizes-agentes.md`, `docs/desenvolvimento/checklist-executivo.md`, `docs/produto/contratos/informacoes-gerais.md`, `docs/produto/contratos/ciclo-de-vida-atas.md` e documentação canônica consultada no levantamento técnico.
- `src/domain/schemas.ts:53`, `src/domain/schemas.ts:127`, `src/domain/form-schemas.ts:139`, `src/domain/enums.ts:102`.
- `src/lib/sheets/contract.ts:2`, `src/lib/sheets/schemas.ts`, `src/lib/sheets/create-ata.ts:84`, `src/domain/aggregate.ts:106`.
- `src/app/atas/nova/ata-form.tsx:430`, `src/app/atas/nova/actions.ts:76`, `src/app/atas/ata-review-layout.tsx:164`, `src/app/atas/[ataId]/page.tsx:24`, `src/lib/pdf/ata-pdf-document.tsx`.
- `src/app/responsavel/atas/page.tsx:50`, `src/app/responsavel/atas/responsavel-atas-table.tsx:169`, `src/app/admin/atas/admin-atas-data.ts:69`, `src/app/admin/atas/admin-atas-table.tsx:230`.
- `src/app/grupos/group-editor.tsx`, `src/app/grupos/group-schedules-editor.tsx`, `src/app/grupos/actions.ts`, `src/lib/auth/access.ts:35`.
- `src/app/relatorios/monthly-group-dashboard-data.ts:185` e `:225`.

### Imagens da pasta V2

Os 36 JPG foram examinados individualmente. A tabela usa o prefixo numérico único de cada nome de arquivo, sem alterar as fontes.

| Prefixo | Evidência e solicitação associada |
| --- | --- |
| 349 | Cadastro de Servidores da Mesa com encargos, menus e botão Adicionar encargo. |
| 352 | Trocar identificação superior Responsável por Configurações. |
| 354 | Retirar card Horários ativos e mover Última reunião antes do sistema para Dados do grupo. |
| 357 | Simplificar rótulos para Email e Link da ata. |
| 359 | Encargos por seleção, opção Outro, excluir, coluna Desde e apresentação de (vago). |
| 361 | Modal Adicionar servidores; nome simplificado e seleção de encargo. |
| 363 | Horários de Reunião e padronização de maiúsculas nos títulos. |
| 365 | Retirar fuso da apresentação e informar Horário de Brasília; texto menciona ícone informativo. |
| 367 | Prefixo Grupo, entrelinha, Data/Horário, plataforma por horário e alterações de formatos. Remoção de Preenchido por aparece como pergunta. |
| 368 | Plataforma selecionável e padronização de rótulos Tipo de reunião/Formatos. |
| 369 | Anotações sobre Comemorativa e Serviço; não permitem concluir todas as opções a excluir. |
| 370 | Remoção do bloco Participação; texto sugere levar dados ao resumo/revisão. |
| 372 | Inverter Participação e Servidores; Localidade como Membros Nacionais. Diverge da remoção anterior. |
| 373 | Alinhamento à esquerda do autocomplete de cidades. |
| 374 | Cidade e Descrição juntas, origem abaixo, Ingresso para Provável adicto. |
| 375 | Disposição alternativa dos campos de visitante; áudio associado não analisado. |
| 380 | Conquista/Conquistas em lugar de Conquistas de tempo. |
| 381 | Localidades Nacionais/Internacionais; sentido da inversão não inteiramente determinado. |
| 383 | Resumo móvel e matriz de indicadores definida em setembro. |
| 463 | Menu: Dados cadastrais → Histórico de atas → Relatórios. |
| 464 | Remover cards; anotação pede verificar ordenação por ID, data e horário. Texto do chat sobre ordenação é ambíguo. |
| 465 | Tela Todas sem anotação; depende do áudio 466. |
| 467 | Retirar abas Atas enviadas/Por servidor/Todas da apresentação. |
| 468 | Campo de revisão em Dados do grupo; texto corrige nome para Revisão de Atas e pede informação no hover. |
| 469 | Contexto de histórico/revisão; áudio 470 não analisado. |
| 473 | Corrigir e Aprovar no rodapé de revisão; não estabelece sozinho autorização ou mudança de estado. |
| 475, 476 | Mesma captura, filtros usados conjuntamente; critérios dependem do áudio 477. |
| 478 | Destaque da coluna Ata sem instrução visual inequívoca; texto seguinte pede barras na data. |
| 481 | Novo indicador Reuniões desde a fundação no Consolidado. |
| 485 | Menu de ações, exclusão com confirmação, nova ação Aprovar e estudo de lote no texto. |
| 487 | Título Ata de reunião nº xx; fonte da numeração não comprovada. |
| 489 | Navegação Ata anterior/Próxima ata. Ordem não especificada. |
| 492 | Informações gerais: data, hora, preenchido por, plataforma, tipo, formatos. |
| 494 | Retirar bloco Identificação da ata do frontend; não autoriza apagar identificadores persistidos. |
| 496 | Blocos de detalhe; texto de outubro define nova ordem dos nove indicadores. |

### Vídeo e áudios

`00000386-VIDEO-2026-09-01-16-56-34.mp4`: 17,44 segundos, 1080 × 2340, inspecionado por frames a cada segundo.

- 0:00–0:01: Configurações do grupo Unidade & Propósito Roraima em celular, dois horários ativos e referência anterior 168.
- 0:02–0:06: menu aberto, aparente tentativa de acessar Responsável, tela vazia e retorno a Configurações.
- 0:07–0:11: comportamento semelhante se repete.
- 0:14–0:16: menu novamente aberto.

São 14 áudios `.opus`, com aproximadamente 6min01s no total: prefixos 308, 350, 376, 385, 388, 466, 470, 474, 477, 479, 488, 490, 493 e 497. Inicialmente não havia Whisper nem modelo local. O usuário autorizou explicitamente a instalação durante a investigação, superando a restrição da rotina consultada. Foram instalados Whisper e PyTorch CPU em ambiente isolado `/tmp/gs-mapeamento-whisper-env`, com download do modelo oficial medium para processamento local. Todos os 14 áudios e a faixa sonora do vídeo foram transcritos; processo concluído com código zero. TXT, JSON e SRT temporários estão em `/tmp/gs-refatoracao-transcricoes/`; as transcrições também foram preservadas abaixo neste documento.

Após encerramento inesperado do VS Code, os arquivos foram preservados, mas o processo original estava inativo, com log parado no carregamento. A causa do encerramento não foi comprovada. A retomada utiliza carregamento do modelo por mmap, sem duplicar integralmente os pesos, e três threads; o primeiro áudio foi concluído com pico de memória medido em aproximadamente 2,2 GB.

| Áudio | Evidência oral já processada |
| --- | --- |
| 308, agosto | Relata que tentar acessar Responsável ou Relatórios retorna a Configurações. É evidência histórica adicional de navegação, correlacionada ao vídeo, sem comprovar persistência ou causa no contexto atual. |
| 350 | Criar bloco de Plataforma com disposição semelhante a Servidores da Mesa: nome, link e botão de ações. O texto inicial da conversa exige múltiplas plataformas por grupo; não define simultaneidade numa reunião. |
| 376 | Dividir a linha inferior do visitante em duas partes responsivas e incluir checkbox Ingresso condicionado à descrição Provável adicto. A lixeira permanece no container inferior conforme texto posterior. |
| 385 | Levar os cards Membros presentes e Partilhas para o container inferior, formando nove blocos em grade 3 × 3. É reorganização espacial; não especifica novas fórmulas. |
| 388 | Relato de falha do menu do responsável no Android em Chrome e Firefox; reforça o contexto histórico do vídeo. |
| 466, 0:16–0:56 | O histórico do responsável deve retornar reuniões não enviadas por data e horário, considerando o horário já passado, com status vermelho. A fala sobre o campo que fica vazio tem transcrição ambígua entre Ata/data; o preenchido por deve ficar vazio. Não foi definida tolerância ou duração para considerar atraso. |
| 470, 0:00–0:49 | Configuração de revisão em Dados do grupo, desmarcada por padrão. Desmarcada: novas atas chegam como Enviada. Marcada: novas atas chegam como Pendente de revisão. O nome definitivo Revisão de Atas vem da correção escrita de outubro. A fala não define efeitos retroativos, autorização para aprovar ou inclusão nos relatórios. |
| 474, 0:13–0:50 | Ações → Editar deve abrir diretamente a mesma apresentação do popup de ata preenchida, com os campos liberados para edição e botões conforme imagem 473. A indicação de Corrigir/Aprovar está, portanto, associada à edição; não comprova renomear a confirmação do formulário público. |
| 477 | Filtros usados conjuntamente: data, horário e preenchido por. Data deve permitir dia específico, intervalo e mês. Status com apresentação mais discreta, em legenda. Interseção entre filtros é interpretação técnica comunicada ao usuário, não uma palavra expressamente pronunciada. |
| 479 | Remover o hashtag do índice da ata, inverter sua ordem e exibir zero antes de 1–9. Na apresentação: 01–09; não foi solicitada conversão do número persistido em texto. A coexistência de ordenação por índice e linhas sem ata requer decisão. |
| 488 | Remover nome do grupo do título e adotar o padrão da imagem 487: Ata de reunião nº xx. |
| 490 | No detalhe `/atas/[id]`, adicionar botões Ata anterior e Próxima ata. Não define ordenação ou relação com filtros da listagem. |
| 493 | No detalhe da ata, retirar Membros presentes e Partilhas do bloco de Informações gerais mostrado na imagem 492 e deslocá-los para outra seção. Não pede apagar os valores persistidos. |
| 497 | Numerar os itens dos blocos Localidades, Membros internacionais, Visitantes, Ingressos e Conquistas, tomando Servidores como padrão. O áudio reconhece a redundância de número junto a rótulos já numerados e mantém o pedido. Não define uma nova fórmula dos indicadores. |

A faixa sonora do vídeo confirma o comportamento visível: 0:00–0:07, clicar em Responsável recarrega a página; 0:07–0:14, Relatórios também; 0:14–0:17, Configurações permanece selecionada. A transcrição é coerente com a imagem e não foi tratada como fala alucinada sobre silêncio.

### Transcrições automáticas preservadas

Evidência auxiliar gerada localmente com Whisper medium. Grafia e segmentação automáticas podem conter erros; os requisitos interpretados e as decisões do usuário estão registrados separadamente acima e na Análise.

<details>
<summary>00000308-AUDIO-2026-08-28-10-24-20</summary>

> [00:00] Fala mano, desculpa, eu acho... eu tô me confundindo aqui, na verdade essa janela é a janela de configurações né
> [00:07] Então quando eu clico em responsável ou em relatórios ele sempre me joga de volta pra essa janela aí

</details>

<details>
<summary>00000350-AUDIO-2026-09-01-15-12-43</summary>

> [00:00] Eu preciso criar um container de plataforma
> [00:05] com a mesma disposição de servidores de mesa,
> [00:08] com o nome da plataforma, com o link da plataforma e o botão de ações.

</details>

<details>
<summary>00000376-AUDIO-2026-09-01-16-37-08</summary>

> [00:00] Na imagem de cima, onde como chegou a ANA, eu vou dividir o container em duas partes iguais, responsivas,
> [00:08] e eu vou colocar um checkbox escrito ingresso condicionado à descrição provável adicto.

</details>

<details>
<summary>00000385-AUDIO-2026-09-01-16-51-32</summary>

> [00:00] A gente vai pegar os cards de membros presentes e partilhas e adaptar no
> [00:07] container de baixo. Serão 9 blocos ali, um 3 por 3.

</details>

<details>
<summary>00000386-VIDEO-2026-09-01-16-56-34</summary>

> [00:00] Quando eu clico aqui no menu e eu clico em responsável, ele recarrega essa página.
> [00:07] Quando eu clico em relatórios, ele também recarrega essa página.
> [00:14] Quando eu clico no menu, sempre está selecionada a opção aqui configurações.

</details>

<details>
<summary>00000388-AUDIO-2026-09-01-16-56-43</summary>

> [00:00] O usuário está relatando que ao acessar do Android, seja no Chrome, seja no Firefox,
> [00:07] ao clicar no menu do responsável, ele não está funcionando, seja configurações, seja
> [00:16] relatórios, seja responsável.
> [00:19] Ok?

</details>

<details>
<summary>00000466-AUDIO-2026-10-15-15-52-09</summary>

> [00:00] Preciso fazer a implementação onde eu
> [00:07] retornar para o menu atualmente aparecendo
> [00:13] ainda como responsável ATAS. Eu preciso
> [00:16] que retorne as reuniões por status não
> [00:21] enviados, mas com o parâmetro de dia e
> [00:26] com o parâmetro de hora. Esse parâmetro
> [00:29] pode ser, eu preciso só entender o que é possível criar com parâmetro de hora,
> [00:36] retornando o que é não enviado, por já ter passado do horário,
> [00:40] puxando ali a data e puxando o horário.
> [00:45] Então, aí eu vou ter um registro, de data não vai aparecer valor,
> [00:50] preenchido por não vai aparecer valor, me retorna data, me retorna horário
> [00:53] e vai me retornar status em vermelho.

</details>

<details>
<summary>00000470-AUDIO-2026-10-15-16-02-00</summary>

> [00:00] Eu preciso de uma funcionalidade que vai ser adotada na seção dados do grupo
> [00:08] chamado revisão de ata e dois pontos pendentes de revisão.
> [00:18] Ele já por padrão aparece desmarcado das configurações.
> [00:23] Caso isso esteja desmarcado, por padrão as atas chegam na base de dados,
> [00:32] na irresponsável atas, com status de enviado.
> [00:38] Caso pendente e revisão nas configurações esteja marcado,
> [00:43] por padrão as atas chegam com status pendente de revisão.

</details>

<details>
<summary>00000474-AUDIO-2026-10-15-16-10-20</summary>

> [00:00] na funcionalidade de edição,
> [00:06] na funcionalidade de...
> [00:13] no botão Ações, na aba Responsável Atas,
> [00:16] no botão Editar,
> [00:18] fazer essa implementação
> [00:20] e utilizar.
> [00:22] Na hora de editar,
> [00:26] vai aparecer diretamente a mesma versão que aparece no pop-up de ata preenchida
> [00:35] e eu vou utilizar esse mesmo padrão, só vou alterar os botões conforme foto acima
> [00:41] e todos os campos serão liberados para edição nessa possível edição de ata.

</details>

<details>
<summary>00000477-AUDIO-2026-10-15-16-19-51</summary>

> [00:00] Preciso criar um filtro aqui e verificar a possibilidade de movimentar ali a aba status,
> [00:06] colocar ela mais em forma de legenda, não tão visual,
> [00:09] e eu preciso criar um filtro onde todos possam ser clicados conjuntamente.
> [00:15] São eles data, horário, preenchido por?
> [00:18] Pode falar o que faltou, Marcos.
> [00:21] No campo data,
> [00:23] ter a opção de selecionar data específica, intervalo e mês ou mês.
> [00:31] O que mais?
> [00:34] Só.
> [00:35] Fechou.

</details>

<details>
<summary>00000479-AUDIO-2026-10-15-16-21-16</summary>

> [00:00] Preciso remover o hashtag do índice da diata e colocar na ordem inversa.
> [00:08] Preciso também que ele do 1 até o 9 tenha o zero antes, ok? No formato de dezena.

</details>

<details>
<summary>00000488-AUDIO-2026-10-15-16-51-26</summary>

> [00:00] remover o nome do grupo e escrever por padrão conforme está ali no exemplo acima.

</details>

<details>
<summary>00000490-AUDIO-2026-10-15-16-56-01</summary>

> [00:00] implementar a funcionalidade em barra atas, A e D,
> [00:06] um botão acima escrito ata anterior e próxima ata,
> [00:12] com a possibilidade de passar de ata em ata.

</details>

<details>
<summary>00000493-AUDIO-2026-10-15-17-02-09</summary>

> [00:00] em barra atas, barra id, id data, remover dentro da imagem
> [00:08] os campos, membros presentes e partilhas e ele será deslocado para outra seção.

</details>

<details>
<summary>00000497-AUDIO-2026-10-15-17-15-46</summary>

> [00:00] Eu preciso aplicar a numeração que está colocada em servidores,
> [00:06] que seja aplicada em localidades, membros internacionais, visitantes.
> [00:10] No visitante, ao invés de ser visitante,
> [00:14] bom, já tem visitante 1 ali, né? Vai ficar redundante.
> [00:19] Ingresso, numeração também, e conquista de tempo, já tem o número ali.
> [00:23] Acho que vai ficar redundante, mas tudo bem.
> [00:25] Vamos colocar o número...
> [00:27] E é isso aí, gente.
> [00:28] Eu e Max.

</details>

### Produção com Playwright

A conexão expôs somente uma página e um contexto, autenticados como responsável do grupo USL. Não se inferiu o papel pelo navegador ou pela posição na captura enviada.

Foram consultados, sem submissões:

- `/responsavel/atas`: 112 atas, zero no mês, dez servidores; cards, abas, datas com hífens e coluna Ata presentes.
- Menu da primeira ata: Visualizar, Visualizar PDF, Editar indisponível e Excluir indisponível; Aprovar ausente.
- Configurações do próprio grupo: 26 horários ativos, referência anterior zero, Servidores da Mesa e Horários do grupo.
- Navegação de Configurações para Responsável: funcionou no contexto desktop consultado.
- Navegação pelo menu em viewport de 390 × 844: Configurações → Responsável abriu `/responsavel/atas`, exibiu GRUPO USL e fechou o menu. Trata-se de viewport móvel no navegador conectado, não do mesmo Android/grupo do vídeo.
- `/responsavel/relatorios`: Out/2026, Total de reuniões 115, Reuniões sem ATA/Sala fechada 115 e presenças zero. Valores são observações da tela, sem auditoria da base.
- `/atas/nova`: Informações gerais, Participação, Servidores, Localidade, Membros internacionais, Visitantes, Ingressos e Conquistas de tempo continuam presentes. Nenhum campo foi preenchido nem confirmado.

A sessão foi deixada novamente em `/responsavel/atas`, com viewport 1280 × 900. Não foi acessada a sessão administrativa do outro navegador. Não foi reproduzido o cenário exato de aparelho/grupo do vídeo.

## Estado observado

1. O cadastro atual tem uma plataforma e um acesso por grupo. Horários possuem link próprio, mas não referência à plataforma. A criação impõe a plataforma do grupo no backend, mesmo se o payload trouxer outra.
2. A legenda possui Pendente de revisão, mas as linhas de atas existentes recebem status Enviada no código de listagem. Não há configuração de revisão ou status de aprovação nos cabeçalhos atuais de persistência.
3. Editar e Excluir estão desabilitados nas tabelas. O contrato documental já prevê revisão versionada e exclusão lógica, com motivo e autorização. Esses campos ainda não estão no contrato executável de Sheets consultado.
4. O formulário é compartilhado entre contextos. Preenchido por e totais continuam exigidos. Serviço não está no enum atual de formatos.
5. Visitantes e ingressos são listas independentes vinculadas à ata. Não há vínculo de um ingresso a um visitante específico.
6. Resumo de confirmação e detalhe usam `AtaReviewLayout`; o PDF possui implementação própria.
7. A listagem do responsável usa o primeiro servidor para preencher a coluna apresentada como Preenchido por, em vez de `ata.preenchido_por`.
8. O total mensal de reuniões é a quantidade prevista pela agenda. Existe referência anterior ao sistema, mas não data de fundação no contrato do grupo.
9. As demandas mais recentes mudam explicitamente a ordem de indicadores, mas não resolvem todos os pedidos anteriores.
10. O domínio conta localidades distintas, mas o resumo conta registros brasileiros. O indicador Países inclui Brasil; Membros internacionais conta registros internacionais, não pessoas nem países únicos. Conquistas soma as quantidades, por expansão dos itens, em vez de contar linhas.
11. A referência Última reunião antes do sistema é persistida, mas não foi encontrada aplicação dela como base de numeração ou de relatório. A criação usa o maior sequencial do grupo + 1 e atribui inicialmente o mesmo valor ao índice personalizado, independentemente da data da reunião.
12. O áudio 466 pede incluir reuniões sem ata no histórico do responsável, com estado determinado pela agenda e pelo horário. A listagem atual do responsável não contém essa população; o administrador possui cálculo de faltantes, limitado ao mês corrente até hoje, que não comprova atendimento à regra horária desejada.

## Análise

### Dependências por camada, sem sequência de execução aprovada

| Camada ou responsabilidade | Demandas relacionadas | Dependência ou limite observado |
| --- | --- | --- |
| Contratos e configuração | Plataformas por grupo/horário, formatos, ingresso por visitante, estado de aprovação | Proprietários: `src/domain/schemas.ts`, `form-schemas.ts`, `enums.ts`, `hidden-submission.ts` e configurações do grupo. Alterar cardinalidade ou vínculos não se resolve apenas no componente visual. |
| Persistência e leitura | Novas relações e estados no Sheets; preservação de UUIDs, registros antigos e revisões | Proprietários: `src/lib/sheets/contract.ts`, `schemas.ts`, `create-ata.ts`, repositórios e reconciliação. Google Sheets continua sendo a fonte oficial; migrar estrutura é operação distinta da análise. |
| Autorização e ciclo de vida | Aprovar, lote, editar por revisão e excluir logicamente | Proprietários: Server Actions e `src/lib/auth/access.ts`; regras documentais em `ciclo-de-vida-atas.md`. Aprovação é um eixo diferente de registro ativo/substituído/excluído. Botões dependem de autorização e transição persistida. |
| Agenda e agregação | Não enviada após duas horas, filtros por ocorrência, indicadores aprovados e acumulado histórico | Proprietários: `src/domain/rules.ts`, agregação e modelos das listagens/relatórios. Dependem da agenda válida, do fuso, do estado de aprovação e da identidade grupo/data/horário. Agenda prevista não comprova reunião realizada. |
| Interface compartilhada | Menu, cards, abas, formulário, Resumo, edição, detalhe e navegação entre atas | Proprietários: `navigation-config.ts`, shells, `ata-form.tsx`, tabelas e `ata-review-layout.tsx`. Parte visual pode ser independente; campos e ações dependem dos contratos anteriores. Responsável e link público compartilham preenchimento. |
| PDF | Dados e rótulos alinhados com o detalhe; composição própria para impressão | Proprietário: `src/lib/pdf/ata-pdf-document.tsx`, com apresentação em `ata-presentation.ts`. Renderizador separado não acompanha automaticamente mudanças no componente de tela. |

Este mapa representa relações técnicas observadas, não fases de implementação ou prioridade fechada.

### Divergências que afetam o entendimento

- Setembro permite interpretar Participação como removida ou reposicionada. Os campos necessários ao domínio continuam existentes; resumo somente de leitura não substitui sua coleta.
- Setembro ordena o resumo como Servidores/Membros/Partilhas → Cidades/Estados/Países → Visitantes/Ingressos/Conquistas. Outubro muda para Servidores/Membros/Partilha → Visitantes/Ingresso/Conquista → Cidades/Estados/Outros países.
- Há nomes diferentes para localidades nacionais e internacionais. O material não estabelece se a nomenclatura mais recente dos indicadores vale também para os blocos editáveis.
- O pedido de remover Preenchido por em setembro é interrogativo; em outubro ele consta expressamente entre os campos do detalhe.
- Remover Identificação da ata não equivale a remover coluna Ata, número público da reunião, UUID ou sequência persistida.
- A anotação sobre ordenação em 464, o áudio 479 e o texto abreviado não estabeleciam uma regra única para linhas com e sem ata. Q9 resolveu a ordem inicial por data e horário decrescentes.
- O áudio 474 associa Corrigir/Aprovar à edição do resumo. O estado inicial vem da configuração do áudio 470; Q5/Q6 definem efeitos nos indicadores e autorização. Não se estende automaticamente o botão Aprovar ao formulário público.
- O novo rótulo Outros países não é equivalente ao indicador Países atual, que inclui Brasil (`src/domain/rules.ts:74`). Cidades também exige distinguir linhas de participação e cidades distintas (`:62`).
- A numeração visível é o índice personalizado, editável, enquanto o sequencial é calculado pela ordem de inserção (`src/domain/ata-identifiers.ts:45`, `src/lib/sheets/ata-admin.ts:69`). Eles não comprovam quantidade histórica de reuniões realizadas. Um índice manual que ocupe o próximo sequencial pode causar conflito na criação; não foi executado teste de escrita.
- O responsável não possui hoje os filtros estruturados de datas/pessoa/status do administrador. As três abas recebem a mesma lista de atas gravadas, e Por servidor muda a ordenação. Não demonstram três populações de status diferentes.
- O vídeo sustenta uma dificuldade histórica de navegação móvel. A navegação atual funcionou em desktop e viewport móvel para USL; isso não confirma correção do cenário Android/grupo do vídeo nem sua causa.

### Árvore de decisões e entendimento consolidado

Decisões confirmadas pelo usuário nas rodadas de grilling:

- Outubro prevalece quando contradiz setembro; setembro permanece nos pontos não substituídos.
- Aplicar os pedidos às telas indicadas no material e avaliar explicitamente as extensões aos demais contextos.
- Manter os mesmos campos e regras de preenchimento no formulário do responsável e no link público; permissões de revisão/aprovação são tratadas separadamente.
- Alinhar dados e rótulos entre detalhe da ata e PDF, preservando layout próprio para impressão.
- Q5: atas pendentes não participam dos totais/relatórios; passam a contar após aprovação. Permanecem visíveis no histórico/filtros. Com revisão desativada, o fluxo de entrada sem pendência do áudio 470 permanece aplicável.
- Q6: responsável autenticado aprova atas do próprio grupo; administrador aprova de qualquer grupo; link público apenas envia.
- Q7: tolerância de duas horas após o início para sinalizar reunião sem ata como Não enviada. Exemplo comunicado: início às 19h, atraso após 21h. Não foi decidida uma nova configuração editável de tolerância; o valor solicitado é duas horas.
- Q8: Reuniões desde a fundação = referência Última reunião antes do sistema + quantidade de reuniões com ata aprovada. Cada reunião conta uma vez, mesmo com revisões; reuniões sem ata não são acrescentadas.
- Q9: considerar o horário quando houver várias reuniões do mesmo grupo no mesmo dia. Cada ocorrência é identificada por grupo + data + horário e possui situação própria; horário restringe os filtros conjuntamente. Após refinamento, usuário confirmou ordem inicial por data decrescente e horário decrescente no mesmo dia; número da ata continua ordenável pela coluna.
- Q10: incluir aprovação em lote de atas pendentes selecionadas explicitamente, com confirmação da quantidade.
- Q11: Ata anterior/Próxima ata respeitam filtros e ordem da listagem de origem, percorrendo atas existentes e acessíveis. Não há detalhe de ata para linha sem registro.
- Q12: Reuniões desde a fundação usa todo o histórico até hoje, independentemente do mês selecionado no relatório. É um acumulado atual, distinto dos indicadores mensais; um relatório de mês anterior pode ter esse acumulado alterado por novas aprovações.
- Q13: cada horário possui uma plataforma selecionada entre as cadastradas no grupo; a ata herda essa plataforma. Não haverá múltiplas plataformas simultâneas na mesma reunião neste escopo.
- Q14: substituir o preenchimento separado de Ingressos pelo checkbox do visitante Provável adicto; cada marcação gera um ingresso e aproveita a cidade do visitante. Registros históricos não vinculados não recebem associação inventada.
- Q15: Cidades e Estados contam localidades distintas do Brasil; Outros países conta países estrangeiros distintos, excluindo Brasil. Quantidade de pessoas continua em Membros.
- Q16: retirar Participação como bloco separado e manter Membros/Partilhas editáveis no Resumo ao fim do formulário; demais totais são calculados.
- Q17: adicionar Comemorativa e Serviço mantendo as opções atuais de formatos e a leitura do histórico.
- Q18: horário herda o link da plataforma por padrão e pode ter exceção própria de link.
- Q19: exibir horários em Brasília, com conversão a partir do fuso original quando necessária, preservando registros históricos. Conversão que atravessa a meia-noite afeta também a data exibida e a correspondência dos filtros; não autoriza reescrever a chave histórica de uma reunião.
- Q20: somente apontar faltantes retroativos onde houver agenda válida comprovada para o período; atas existentes continuam consultáveis. Não aplicar silenciosamente a agenda atual a todo o passado.
- Q21: permitir reuniões extras fora da agenda, com escolha explícita de uma plataforma cadastrada no grupo; reuniões previstas herdam a plataforma do horário.

As raízes de produto investigadas estão decididas. A regra de estado inicial por configuração foi esclarecida pelo áudio 470: revisão desmarcada por padrão recebe novas atas como Enviada; marcada recebe como Pendente de revisão. Não foi solicitado reclassificar retroativamente as atas existentes.

A decisão Q5 torna necessária a distinção entre ata existente pendente e reunião sem ata. Inferência técnica: excluir pendentes dos indicadores de participação não significa classificá-las como sala fechada ou ata não enviada, pois há registro recebido.

As decisões Q6, Q7 e Q20 resolvem autorização básica, tolerância horária e critério de validade da agenda histórica. Períodos sem evidência de agenda não podem receber registros presumidos de Não enviada. A existência de timestamps no cadastro atual, sem versões anteriores, não comprova por si só todos os dias e horários de funcionamento no passado.

Interpretações de continuidade dos contratos: edição preserva a versão anterior, exclusão é lógica e exige confirmação/motivo, e UUIDs/identificadores técnicos permanecem persistidos embora o bloco visual seja retirado. O ato explícito Aprovar cabe aos papéis definidos em Q6; enviar pelo link público não concede essa permissão. A retirada do bloco Ingressos do preenchimento não apaga nem associa arbitrariamente dados antigos.

Q22: em 16/10/2026, o usuário respondeu “Confirmo o entendimento registrado”. O diagnóstico e as 21 decisões foram confirmados, encerrando a entrevista e a fase de análise. Essa confirmação não autoriza implementação. A escolha de implementação, migração técnica, testes de escrita e publicação pertence a uma etapa posterior, ainda não executada.

### Achado técnico relacionado ao limite de autorização

`createAtaAction` exige sessão e confirmação (`src/app/atas/nova/actions.ts:76`), mas nesse fluxo não foi identificada checagem explícita de associação do usuário ao grupo recebido antes de persistir. O fluxo público, em contraste, fixa o grupo a partir do token (`:105`). A persistência valida existência/atividade do grupo. Esse achado de leitura merece verificação específica antes de novas mutações; não foi explorado nem comprova acesso indevido ocorrido em produção.

## Hipóteses avaliadas

| Hipótese | Avaliação |
| --- | --- |
| A demanda inteira consiste em refatoração visual | Descartada: múltiplas plataformas, aprovação e vínculo visitante/ingresso alteram contratos ou regras ainda inexistentes. |
| Pendente de revisão na legenda comprova fluxo de aprovação pronto | Descartada no código consultado: status das atas é fixado como Enviada e faltam campos executáveis para aprovação. |
| O problema móvel de setembro permanece hoje | Inconclusiva: o vídeo é histórico e a navegação desktop atual funcionou; não houve reprodução equivalente em celular. |
| O indicador desde a fundação pode usar diretamente o total mensal atual | Descartada: total atual representa agenda prevista mensal; não o acumulado histórico realizado. |

## Diagnóstico

A demanda reúne alterações de apresentação, mudanças de domínio e funcionalidades novas de ciclo de vida. O projeto oferece componentes compartilhados de formulário/resumo e persistência centralizada que permitem mapear suas dependências, mas não sustenta executar todo o conjunto como uma única alteração de interface.

O levantamento integral do material e as 21 decisões de produto permitem identificar seis responsabilidades: contratos/configuração, persistência, ciclo de vida/autorização, agenda/agregação, interface compartilhada e PDF. As dependências são estruturais: aprovação e relações precisam existir como dados e regras antes de serem assumidas por ações e indicadores; ajustes estritamente visuais têm alcance diferente. A fronteira entre refatoração visual, mudança de contrato e nova funcionalidade está demonstrada.

Os principais desvios confirmados no código são: plataforma única imposta pelo grupo; ausência de aprovação persistida apesar da legenda; edição/exclusão ainda indisponíveis; falta de reuniões sem ata na listagem do responsável; campo Preenchido por alimentado pelo primeiro servidor nessa listagem; e cálculos atuais que não correspondem ao acumulado histórico ou aos novos rótulos geográficos. Não foi demonstrada falha atual de navegação no contexto consultado; o relato e o vídeo permanecem evidências históricas.

Este documento é a base diagnóstica e de decisões confirmada pelo usuário na Q22, sem plano executivo ou implementação. A sessão administrativa ao vivo não foi consultada; isso limita a validação de produção por papel, mas não impede as conclusões documentadas sobre o código e as fontes.

## Grau de certeza

Alto quanto aos limites dos contratos e componentes locais citados, às decisões expressas pelo usuário e às telas diretamente consultadas com Playwright. Médio para trechos de transcrição automática ambíguos, identificados junto às evidências. A equivalência exata entre checkout e deploy não foi comprovada. A causa do encerramento do VS Code e a causa histórica da navegação permanecem inconclusivas.

## Pontos ainda não comprovados

- Comportamento ao vivo do administrador, preservando a sessão atual até haver necessidade concreta de troca.
- Agenda histórica comprovada de cada grupo: o contrato atual não oferece versões de vigência para reconstruir livremente períodos passados.
- Fusos efetivos dos registros antigos e conversões que mudem o dia exibido, antes de definir qualquer transformação técnica.
- Reprodução do problema de navegação no mesmo contexto móvel do vídeo.
- Estado real de linhas/validações do Sheets, versão exata do deploy e validação funcional de escrita, que não fizeram parte desta investigação somente de leitura.
