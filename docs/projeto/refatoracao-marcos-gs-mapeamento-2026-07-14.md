# Refatoracao Marcos - GS Mapeamento

Data da origem: 2026-07-14  
Data da analise: 2026-07-16  
Fonte de verdade da demanda: `docs/REFATORACAO-1_MARCOS/`

## 1. Contexto

Este documento consolida a analise tecnica das solicitacoes registradas na
conversa com Marcos em `docs/REFATORACAO-1_MARCOS/_chat.txt`, com a instrucao
operacional resumida em `docs/REFATORACAO-1_MARCOS/chatgpt.md`.

O objetivo desta etapa e organizar a refatoracao em ciclos seguros. Este
documento nao implementa produto, nao altera modelo de dados, nao cria
migracoes e nao remove campos.

As solicitacoes cobrem quatro blocos principais:

- simplificacao das telas do responsavel e de grupo;
- ajustes no formulario de ata;
- mudancas estruturais em visitantes, ingressos, conquistas de tempo,
  numeracao e seguranca de link;
- visualizacao, edicao, auditoria e PDF da ata.

## 2. Estado atual do projeto

### Stack e arquitetura

- Aplicacao Next.js App Router com React e TypeScript.
- Autenticacao via Auth.js em `src/auth.ts`.
- Persistencia oficial no Google Sheets via `googleapis`.
- Contrato de abas e colunas em `src/lib/sheets/contract.ts`.
- Dominio e validacoes em `src/domain/*`.
- Server Actions para criacao de ata e administracao de grupos.
- Testes com Vitest.

### Rotas relevantes

- `/` em `src/app/page.tsx`: dashboard autenticado com `Grupos ativos` e
  `Atas validas`.
- `/login` em `src/app/login/page.tsx`: login por email/senha e Google.
- `/meu-grupo` em `src/app/meu-grupo/page.tsx`: redireciona responsavel para
  o primeiro grupo associado; administrador vai para `/grupos`.
- `/grupos` e `/grupos/[grupoId]`: administracao e edicao de grupo.
- `/atas/nova`: criacao autenticada de ata.
- `/preencher/[link]`: preenchimento publico por link do grupo.
- `/atas/[ataId]`: detalhe somente leitura da ata.

### Autenticacao e permissoes

O acesso e resolvido em `src/lib/auth/access.ts`.

- E-mails em `AUTH_ALLOWED_EMAILS` entram como `administrador`.
- Responsaveis entram quando existe usuario ativo em `usuarios_grupo`.
- `resolveAccessByEmail` devolve `groups`, permitindo que um responsavel tenha
  mais de um grupo.
- `canAccessGroup` permite acesso total ao administrador e restringe
  responsaveis aos seus grupos.

Impacto direto: remover a lista de grupos da home pode esconder um caso valido
se um responsavel administrar mais de um grupo.

### Persistencia e modelo atual

As abas atuais do contrato estao em `src/lib/sheets/contract.ts`:

- `grupos`;
- `usuarios_grupo`;
- `grupo_horarios`;
- `atas`;
- `servidores`;
- `participacao`;
- `visitantes`;
- `ingressos`;
- `trocas_chaveiro`.

O modelo da ata persiste:

- `atas`: grupo, data, hora, preenchido por, plataforma, tipo, formatos,
  membros presentes, total de partilhas e auditoria;
- `servidores`: nome e ordem;
- `participacao`: localidade, estado, pais e presencas;
- `visitantes`: nome, cidade, categoria e origem;
- `ingressos`: nome e cidade;
- `trocas_chaveiro`: tempo limpo e quantidade.

### Criacao e leitura de atas

- `src/app/atas/nova/actions.ts` valida `confirmed=true`, payload JSON e
  persiste via `createAtaInSheets`.
- `src/lib/sheets/create-ata.ts` valida grupo, duplicidade e materializa IDs.
- `src/domain/creation.ts` bloqueia duplicidade por chave de negocio atual.
- `src/app/atas/[ataId]/page.tsx` exibe detalhe somente leitura.
- Nao existe Server Action, rota ou repositorio para editar ata existente.

### PDF

Nao ha implementacao de geracao de PDF no codigo. A busca por `PDF`, `pdf` e
bibliotecas relacionadas retornou apenas backlog/documentacao e nenhuma
dependencia de geracao.

Existe item em `docs/produto/backlog.md` para exportar ata confirmada em PDF.

## 3. Matriz de impacto

| Solicitacao | Estado atual | Impacto | Complexidade | Risco | Dependencias |
| --- | --- | --- | --- | --- | --- |
| Remover bloco `Grupos ativos` | Home lista todos os grupos permitidos em `src/app/page.tsx` | Front-end e UX de responsavel multi-grupo | Baixa/media | Moderado | Decidir se responsavel pode ter mais de um grupo |
| Remover e-mail do usuario no cabecalho | Home exibe `session.user?.email` | Front-end | Baixa | Baixo | Nenhuma |
| Trocar titulo `GS Mapeamento` pelo nome do grupo | Home e generica; `access.groups` pode ter varios grupos | Front-end e regra de exibicao | Media | Moderado | Decidir comportamento multi-grupo |
| Botao `Gerenciar` ao lado do grupo | Hoje fica dentro do card `Grupos ativos` | Front-end | Baixa | Baixo | Nova organizacao da home |
| Acoes visualizar/editar ata | Visualizar ja existe via link para `/atas/[ataId]`; editar nao existe | Front-end, backend, permissao, Sheets | Alta | Alto | Decidir ciclo de vida da ata |
| PDF da ata | Nao existe implementacao | Nova rota/API, geracao, layout | Media/alta | Moderado | Definir tecnologia e layout |
| Remover responsavel e e-mail responsavel do grupo | Campos obrigatorios em `grupoFormSchema` e usados para acesso/email | Formulario, schema, usuarios_grupo, email | Alta | Alto | Decidir modelo de responsavel |
| Manter e-mail de login | Campo `email_acesso_grupo` e base do acesso de responsavel | Auth, usuarios_grupo | Media | Alto | Nao remover sem substituto |
| Ultima reuniao antes do sistema | Campo nao existe | Nova coluna em `grupos`, schema, Sheets | Media | Moderado | Regra de numeracao |
| Regenerar link de preenchimento | Link atual e slug em `link_formulario_ata` | Grupo, link publico, compatibilidade | Media/alta | Alto | Politica de revogacao |
| Seguranca do link | Link atual e reutilizavel e previsivel por slug | Modelo de link/token | Alta | Alto | Decidir expirar/revogar/uso unico |
| Remover campo grupo na ata quando fixo | `AtaForm` ja recebe `fixedGroupId` no link publico | Front-end | Baixa | Baixo | Confirmar fluxos admin/responsavel |
| Preenchido por automatico | Campo e obrigatorio no schema e UI; fonte nao definida | Auth/link publico/formulario | Media | Moderado | Decidir origem do valor |
| Incluir duracao | Campo nao existe | Schema, Sheets, UI, detalhe | Media | Moderado | Definir formato e obrigatoriedade |
| Formato `Outros` com texto | Enum atual nao tem `outros`; Sheets tem flags fixas | Schema, Sheets, UI | Media/alta | Moderado | Nova coluna para texto |
| Numeracao e duplicidade | Duplicidade ja existe por grupo/data/hora | Modelo de grupo e ata | Alta | Alto | Definir criterio oficial |
| Controles +/- numericos | UI usa selects/inputs; backend valida minimos | Front-end e acessibilidade | Baixa/media | Baixo | Definir maximos |
| Localidade cidade/quantidade | Ja existe parcialmente como participacao/localidade | Front-end e validacao | Baixa/media | Baixo | Regra de duplicidade de cidade |
| Visitantes sequenciais sem nome | Modelo atual exige nome persistido; UI aceita anonimo | UI, schema, relatorio | Media | Moderado | Persistir identificador ou derivar |
| Ingresso como propriedade do visitante | Hoje ingressos e aba separada | Modelo, migracao, agregacao | Alta | Alto | Compatibilidade historica |
| `Troca de ficha` para `Conquistas de tempo` | UI/detalhe usam `Troca de ficha`; enum tecnico `trocas_chaveiro` | Labels simples e possivel enum | Baixa/media | Baixo/moderado | Decidir se muda persistencia ou so exibicao |
| Membros internacionais | Nao ha secao dedicada; participacao suporta pais | Nova estrutura ou reaproveitamento | Media/alta | Moderado | Definir se e agregado separado |
| Funcao de servidor | Servidor tem apenas nome e ordem | Schema, Sheets, UI | Media | Moderado | Lista fixa e multiplicidade |
| Resumo da ata | Modal existe no formulario; detalhe existe separado | UI | Media | Moderado | Conflito com edicao posterior |
| Editar ata enviada | Nao existe fluxo de update | Backend, auditoria, permissao | Alta | Alto | Decisao de negocio obrigatoria |

## 4. Classificacao por dificuldade e risco

### Baixa complexidade / baixo risco

- remover e-mail do cabecalho;
- renomear labels visuais;
- reposicionar botoes;
- trocar titulo de secoes;
- incluir icones;
- ajustar textos de resumo;
- ocultar campo grupo quando `fixedGroupId` ja existir;
- trocar `Troca de ficha` para `Conquistas de tempo` somente na UI.

### Media complexidade / risco moderado

- titulo da home baseado no grupo;
- controles de incremento/decremento;
- campo duracao;
- formato `Outros`;
- funcao de servidor;
- membros internacionais;
- PDF somente leitura;
- regeneracao de link sem historico completo.

### Alta complexidade / alto risco

- remover campos de responsavel/e-mail do contrato de grupos;
- transformar ingressos em propriedade de visitantes;
- editar ata ja enviada;
- numeracao oficial e numero interno;
- revogacao/expiracao/uso unico de link;
- auditoria/versionamento de edicoes;
- migracao de dados historicos.

## 5. Fases recomendadas de implementacao

### Fase 1 - Ajustes visuais seguros

Objetivo: entregar melhoria de tela sem mexer em dominio nem Sheets.

- Remover e-mail do usuario no cabecalho.
- Renomear labels visuais.
- Reposicionar botoes da home.
- Exibir acoes de visualizar ata de forma explicita.
- Renomear visualmente `Troca de ficha` para `Conquistas de tempo`.
- Revisar o resumo visual sem alterar payload.

Criterio de aceite: UI atual funciona igual, sem alterar registros no Sheets.

### Fase 1.1 - Enxugar dashboard de atas

Objetivo: aplicar o layout visual aprovado para o painel do responsavel sem
antecipar backend de edicao ou PDF.

- Simplificar a listagem de atas validas para destacar somente data e horario.
- Remover da linha da ata os indicadores de membros, visitantes e ingressos.
- Exibir acoes por icones: visualizar ativo, editar e PDF como acoes visuais
  desabilitadas ate as fases correspondentes.
- Manter dados, schemas, Server Actions, contrato Sheets, autenticacao,
  permissoes e payloads inalterados.

Criterio de aceite: o responsavel localiza a ata por data/hora e acessa a
visualizacao existente; edicao e PDF nao executam nenhuma acao enquanto nao
forem implementados nas fases 7 e 8.

### Fase 2 - Comportamentos simples do formulario

Objetivo: melhorar preenchimento mantendo contrato atual quando possivel.

- Ocultar grupo quando ja estiver fixo por link ou sessao.
- Definir preenchimento automatico de `preenchido_por` conforme decisao de
  negocio.
- Trocar selects numericos por controles +/- mantendo validacao backend.
- Tratar duplicidade de cidade na UI se a regra for aprovada.
- Adicionar funcao de servidor se for aceita como nova coluna simples.

Criterio de aceite: payload continua validado por Server Action e testes cobrem
limites/erros.

Resultado da decisao em 2026-07-16:

- Implementar nesta fase apenas comportamentos que nao exigem nova regra de
  negocio nem nova coluna.
- `Preenchido por` permanece manual ate a origem oficial ser decidida.
- Duplicidade de cidade permanece sem bloqueio adicional ate a regra oficial
  ser aprovada.
- Funcao de servidor nao entra nesta fase, porque exige coluna
  `servidores.funcao` e pertence ao bloco de campos novos/migracao.

### Fase 3 - Campos novos e migracoes pequenas

Objetivo: adicionar campos sem mudar a identidade de entidades principais.

- Adicionar `duracao`.
- Adicionar `formato_outros` e texto associado.
- Adicionar ultima reuniao anterior em `grupos`.
- Se aprovado, adicionar `funcao` em `servidores`.

Criterio de aceite: contrato Sheets reconciliado, leitura antiga continua
segura e rollback documentado.

Resultado em 2026-07-16:

- Contrato atualizado com `grupos.ultima_reuniao_anterior`, `atas.duracao`,
  `atas.formato_outros` e `servidores.funcao`.
- `duracao` usa texto opcional no formato `H:MM`.
- `formato_outros` usa texto opcional; o formato visual `Outros` exige essa
  descricao no backend.
- `servidores.funcao` usa texto opcional, sem enum fechado nesta fase.
- DEV foi reconciliada e a segunda execucao confirmou idempotencia.
- Antes de levar a PROD, duplicar/exportar a planilha manualmente, pois ainda
  nao existe rotina automatizada de backup no repositorio.

### Fase 4 - Visitantes, ingressos e membros internacionais

Objetivo: tratar mudancas estruturais que afetam indicadores e historico.

- Decidir se visitante sequencial e persistido ou derivado por ordem.
- Decidir se ingresso vira checkbox em visitante ou se a aba `ingressos` fica
  para compatibilidade.
- Definir modelo de membros internacionais: nova aba/campos ou uso de
  `participacao` com pais.

Criterio de aceite: dados antigos continuam legiveis e indicadores nao contam
duplicado.

Rascunho de decisao tecnica nao executado:

- O numero sequencial do visitante sera derivado pela ordem da lista da ata,
  sem coluna persistida. Isso evita migracao desnecessaria e preserva dados
  antigos.
- A aba `ingressos` permanece como estrutura historica e fonte de
  compatibilidade. Nesta fase, ingresso nao vira atributo de visitante para
  evitar contagem duplicada e migracao destrutiva.
- Membros internacionais serao modelados em `participacao`, com campos
  opcionais `internacional` e `tipo_participacao`. O pais continua sendo o
  principal discriminador; Brasil usa `internacional=false`, outros paises usam
  `internacional=true`.
- Indicadores devem continuar contando visitantes e ingressos separadamente.
  Membros internacionais entram apenas nos indicadores de participacao/localidade
  e nao devem inflar visitantes ou ingressos.

Status em 2026-07-16: a Fase 4 foi abortada antes de qualquer implementacao em
codigo, contrato Sheets, migracao ou reconciliacao. O rascunho acima deve ser
tratado apenas como registro historico, nao como decisao validada.

### Fase 5 - Numeracao e duplicidade

Objetivo: criar regra oficial de reuniao.

- Definir `numero_sistema`, `numero_reuniao_grupo` e
  `ultima_reuniao_anterior`, se aprovados.
- Revisar chave de duplicidade atual.
- Criar mensagens claras para conflito.

Criterio de aceite: duas reunioes validas nao sao bloqueadas indevidamente e
duplicidade real e barrada.

### Fase 6 - Seguranca do link

Objetivo: substituir o slug reutilizavel por politica segura.

- Token aleatorio.
- Regeneracao com revogacao.
- Registro de criacao/uso.
- Opcional: expiracao ou link por reuniao.

Criterio de aceite: links antigos seguem uma politica definida e links
revogados nao aceitam envio.

### Fase 7 - Ciclo de vida, edicao e auditoria

Objetivo: resolver o conflito entre ata imutavel e pedido de edicao.

- Definir quem edita.
- Definir prazo/estado de bloqueio.
- Registrar autor e data da edicao.
- Versionar ou sobrescrever com trilha minima.

Criterio de aceite: nenhuma edicao ocorre sem permissao e auditoria definida.

### Fase 8 - PDF e relatorios

Objetivo: exportar ata confirmada.

- Criar exportacao PDF baseada no detalhe somente leitura.
- Incluir novos campos aprovados.
- Garantir que download nao altera Sheets.

Criterio de aceite: PDF contem os mesmos dados do detalhe autorizado.

## 6. Plano de migracao

Qualquer mudanca de contrato Sheets deve seguir esta ordem:

1. Atualizar `SHEET_HEADERS`.
2. Atualizar schemas e conversores em `src/lib/sheets/schemas.ts`.
3. Atualizar dominio/form schemas.
4. Atualizar escrita em `src/lib/sheets/write.ts` e leitura em
   `src/lib/sheets/repository.ts`.
5. Atualizar agregacao e indicadores.
6. Atualizar scripts de reconciliacao.
7. Criar testes.
8. Rodar em DEV.
9. Validar leitura agregada.
10. So depois aplicar em PROD.

Campos que provavelmente exigem migracao:

- `grupos.ultima_reuniao_anterior`;
- `atas.duracao`;
- `atas.numero_sistema`;
- `atas.numero_reuniao_grupo`;
- `atas.formato_outros`;
- `servidores.funcao`;
- eventual alteracao de `visitantes` para incorporar ingresso;
- eventual estrutura de membros internacionais;
- campos de seguranca do link.

Rollback minimo: backup/export da planilha antes de cada reconciliacao e commit
Git antes de cada fase.

## 7. Decisoes de negocio pendentes

1. O responsavel pode administrar mais de um grupo?
2. A ata pode ser editada apos confirmada?
3. Quem pode editar ata: administrador, responsavel, servidor por link ou todos?
4. Existe prazo ou estado que bloqueia edicao?
5. `Preenchido por` vem da sessao, do link, de campo manual ou do responsavel?
6. O link de preenchimento e permanente, temporario, por reuniao ou uso unico?
7. Link antigo deve continuar valido apos regenerar?
8. Qual criterio oficial de duplicidade: grupo/data/hora, numero oficial, ou
   combinacao?
9. Como calcular numero historico quando o grupo informa ultima reuniao
   anterior?
10. Quais limites maximos dos campos numericos?
11. Servidor pode ter mais de uma funcao?
12. Visitante pode representar mais de um ingresso?
13. Ingresso deve migrar para visitante ou manter aba historica?
14. Membros internacionais sao parte de participacao ou uma entidade separada?
15. PDF precisa de layout proprio ou pode seguir detalhe atual?

## 8. Plano de testes

### Testes por fase

- Fase 1: snapshot/manual visual, responsivo desktop/mobile e sem alteracao de
  payload.
- Fase 2: validacao de formulario, limites numericos, payload hidden e erros de
  Server Action.
- Fase 3: testes de schema, conversores Sheets, reconciliacao e leitura
  agregada.
- Fase 4: visitantes/ingressos antigos e novos, indicadores e resumo.
- Fase 5: duplicidade, numeracao por grupo e mensagens de erro.
- Fase 6: link valido, link revogado, link expirado, link antigo.
- Fase 7: permissoes de edicao, auditoria, bloqueio e regressao de somente
  leitura.
- Fase 8: PDF autorizado, dados corretos e nenhum efeito colateral no Sheets.

### Comandos base

- `npm run lint`;
- `npm run test`;
- build de producao antes de fechar fase estrutural.

## 9. Ordem final recomendada

1. Fase 1 - ajustes visuais seguros.
2. Fase 2 - comportamento de formulario sem migracao pesada.
3. Decisoes de negocio sobre edicao, link, numeracao e visitantes/ingressos.
4. Fase 3 - campos novos com migracao pequena.
5. Fase 5 - numeracao e duplicidade.
6. Fase 6 - seguranca do link.
7. Fase 4 - reestruturacao visitantes/ingressos/membros internacionais.
8. Fase 7 - ciclo de vida e auditoria de ata.
9. Fase 8 - PDF.

## 10. Primeiro lote seguro

O primeiro lote recomendado e exclusivamente visual:

- remover e-mail do cabecalho;
- trocar labels e titulos;
- explicitar botao de visualizar ata;
- ajustar posicao do botao `Gerenciar`;
- renomear visualmente `Troca de ficha` para `Conquistas de tempo`;
- manter campos, schemas, Sheets, autenticacao e permissoes sem alteracao.

Esse lote entrega valor rapido e reduz risco antes de qualquer migracao ou
decisao de negocio pendente.
