# Histórico do projeto

Este arquivo registra fatos e marcos concluídos. O estado atual das tarefas fica
no [checklist executivo](../desenvolvimento/checklist-executivo.md); decisões
vigentes ficam no [escopo do MVP](../produto/escopo-mvp.md).

## Origem

O projeto começou como revisão da ata usada em um formulário Jotform. O recorte
inicial foi organizado em Informações Gerais e Participação. O formulário e suas
capturas foram preservados somente como
[referência visual](../referencias/formulario-legado/jotform.html).

## 21 de junho de 2026 — Modelo inicial

- Documentação e DBML harmonizados.
- Planilha estruturada com seis abas, cabeçalhos, filtros e validações.
- Dezessete grupos migrados para UUID.
- IDs anteriores preservados como `zoom_id`.
- Conta de serviço recebeu acesso de edição à planilha.

## 21 de junho de 2026 — Segurança

- Valores mínimos migrados para `.env.local`.
- JSONs de credenciais removidos.
- Regras do Git ampliadas para segredos e chaves.
- Cliente OAuth do n8n descartado.
- Rotação da chave da conta de serviço mantida como requisito pré-implantação.

## 21 de junho de 2026 — Fundação da aplicação

- Next.js App Router, React e TypeScript inicializados.
- Schemas e regras agregadas iniciais criados.
- Adaptador server-only com validação de cabeçalhos implementado.
- Auth.js configurado com Google e lista de e-mails.
- Login real validado.
- Painel autenticado leu os grupos ativos do Sheets.
- As seis abas tiveram seus cabeçalhos confirmados; somente `grupos` possuía
  registros.
- Testes iniciais, lint, TypeScript e build foram aprovados.

## 21 de junho de 2026 — Revisão do domínio

Foram fechadas as decisões de imutabilidade após envio, chave de duplicidade,
municípios brasileiros derivados do IBGE, enums adaptados ao Sheets, edição
manual configurável e planilha exclusiva de testes.

A revisão identificou a necessidade de completar mapeamentos, integridade
referencial, leitura agregada, escrita atômica e cobertura de testes antes do
formulário definitivo.

## 21 de junho de 2026 — Organização documental

A documentação passou a ser organizada por responsabilidade: produto,
arquitetura, desenvolvimento, projeto e referências. Nomes de arquivos foram
padronizados em ASCII `kebab-case` e `docs/README.md` tornou-se o índice
canônico.

## 21 de junho de 2026 — Contratos executáveis

- Schemas de formulário, domínio e linhas do Sheets foram separados.
- Conversões bidirecionais passaram a preservar códigos internos e rótulos em
  português.
- Diagnósticos de leitura passaram a informar aba, número real da linha e
  campo, inclusive após linhas vazias.
- Regras de unicidade, participação, criação com grupo ativo e histórico com
  grupo inativo receberam validações executáveis.
- A base local foi gerada pela API oficial do IBGE com 5.571 municípios, 27
  UFs, fonte e data de atualização.
- Os seis cabeçalhos foram confirmados na planilha oficial e as validações de
  `atas.plataforma` e `atas.tipo_reuniao` foram reconciliadas para `Zoom` e
  `Aberta`/`Fechada`.
- A suíte alcançou 46 testes aprovados; lint, TypeScript e build de produção
  também foram aprovados.

## 21 de junho de 2026 — Leitura agregada

- As seis abas passaram a ser lidas em um único `batchGet`, com validação de
  cabeçalhos e conversão explícita de datas e horários do Sheets.
- Atas completas passaram a ser reconstruídas por `ata_id`, com validação das
  referências de grupo e dependentes.
- Linhas inválidas, duplicadas, órfãs ou inconsistentes passaram a ser isoladas
  com diagnóstico de aba, linha, campo e mensagem.
- Indicadores passaram a considerar somente registros válidos.
- A listagem e o detalhe de atas foram implementados em modo somente leitura,
  preservando a identificação histórica de grupos inativos.
- A leitura real confirmou 17 grupos e as demais cinco abas vazias, com todos
  os cabeçalhos válidos e tipos compatíveis.
- A suíte alcançou 53 testes aprovados; lint e TypeScript também foram
  aprovados antes do fechamento da fase.

## 22 de junho de 2026 — Criação imutável

- O formulário autenticado passou a manter o rascunho somente no navegador e
  permite adicionar, reordenar e remover dependentes antes do envio.
- Um resumo modal completo passou a exigir confirmação explícita e bloquear
  reenvios enquanto a requisição está ativa.
- A Server Action passou a revalidar autorização, payload, grupo ativo e chave
  de duplicidade antes da persistência.
- UUIDs, timestamps e ordens de servidores passaram a ser gerados no backend.
- Ata e dependentes passaram a compor um único `spreadsheets.batchUpdate` com
  `appendCells`, sem chamadas de escrita parciais.
- A busca de municípios passou a usar uma rota autenticada alimentada apenas
  pelo JSON local do IBGE.
- A suíte alcançou 66 testes aprovados; lint, TypeScript e build Webpack de
  produção foram aprovados.
- A escrita real não foi executada porque `GOOGLE_SHEETS_TEST_ID` não está
  configurado; a planilha oficial permaneceu inalterada.

## 22 de junho de 2026 — Política de edição manual

- Uma rotina administrativa server-only passou a validar estritamente a
  política, os IDs e os cabeçalhos das seis abas antes de qualquer mutação.
- Proteções gerenciadas passaram a usar descrição estável, sem remover ou
  modificar proteções manuais, e todas as mudanças necessárias são enviadas em
  um único `spreadsheets.batchUpdate`.
- A política `false` passou a manter uma proteção por aba com escrita permitida
  para a conta de serviço; o proprietário continua capaz de administrar as
  proteções conforme as garantias do Sheets.
- Testes cobriram remoção seletiva, criação das seis proteções, idempotência,
  correção de divergência, preservação manual, falha do lote, configuração
  inválida e permissão da conta de serviço.
- A reconciliação real com `true` aplicou zero mutações. Uma leitura independente
  confirmou os IDs e zero proteções nas seis abas; a planilha oficial permaneceu
  inalterada.
- A suíte alcançou 74 testes aprovados; lint, TypeScript e build Webpack de
  produção com limite de memória também foram aprovados.

## 23 de junho de 2026 — Refatoracao ATA Full backend

- Diagnostico do modelo de ATA registrado em
  `docs/projeto/diagnostico-modelo-ata.md`.
- O backend passou a aceitar `total_partilhas` na aba `atas`.
- A entidade `ingressos` foi adicionada como aba propria, com uma linha por
  pessoa e `total_ingressos` derivado por contagem de linhas validas.
- Trocas de chaveiro passaram a persistir `tempo_limpo` e `quantidade`.
- Os codigos internos/persistidos de `tempo_limpo` passaram para `1M`, `2M`,
  `3M`, `6M`, `9M`, `12M`, `18M` e `MULTIPLOS_ANOS`.
- Leitura agregada, detalhe, listagem, escrita atomica, contrato Sheets,
  scripts de reconciliacao e DBML foram atualizados para o modelo full.
- Atas continuam imutaveis; nenhuma rota ou Server Action de edicao foi criada.
- A suite alcancou 83 testes aprovados; lint e build de producao foram
  aprovados antes do proximo tiro.

## 23 de junho de 2026 — Frontend hidden do modelo ATA Full

- O formulario de criacao passou a enviar payload hidden aceito pela Server
  Action e normalizado no backend para o contrato full.
- Participacao passou a exibir somente localidade controlada e presencas; o
  backend deriva `estado=UF` e `pais=Brasil`.
- Visitantes passaram a exibir somente nome anonimo/opcional e cidade; o
  backend persiste `categoria=outro` e `origem_contato=outro`.
- Ingressos foram adicionados entre Visitantes e Trocas de chaveiro, com uma
  linha por pessoa e suporte a anonimato.
- A UI mostra `Anônimo` e o backend persiste exatamente `Anonimo`
  sem acento.
- Trocas de chaveiro passaram a exibir `tempo_limpo` e `quantidade`.
- O resumo de confirmacao exibe membros, partilhas, participacao, visitantes,
  ingressos e trocas com quantidade.
- O caso real `20 presentes; Itajai=8, Brusque=4, Joinville=3` foi coberto em
  teste e calcula `membros_sem_localidade=5`.
- A suite alcancou 87 testes aprovados; lint e build de producao foram
  aprovados no encerramento da fase.

## 23 de junho de 2026 — Reconciliação Sheets ATA Full

- DEV e PROD foram reconciliadas para o contrato ATA Full com sete abas.
- As duas planilhas receberam a aba `ingressos`.
- As duas planilhas receberam a coluna `atas.total_partilhas`.
- As duas planilhas receberam a coluna `trocas_chaveiro.quantidade`.
- O resultado resumido da reconciliação foi
  `createdSheets=["ingressos"]` e
  `addedColumns=[atas.total_partilhas, trocas_chaveiro.quantidade]`.
- A verificação read-only confirmou as abas `grupos`, `atas`, `servidores`,
  `participacao`, `visitantes`, `trocas_chaveiro` e `ingressos` em DEV e PROD.

## 23 de junho de 2026 — Refatoração UX da ata

- O contrato de produto passou a separar Participação dos registros de
  localidade: Participação contém os totais, enquanto `Localidade - Cidades
  (UF)` registra cidade e quantidade.
- Visitantes e ingressos passaram a usar `Anonimo` como valor persistido quando
  o nome não é informado.
- Ingressos passaram a exigir e persistir `cidade`.
- A interface passou a usar a nomenclatura `Troca de ficha`, mantendo a aba
  técnica `trocas_chaveiro`.
- A reconciliação DEV adicionou a coluna `ingressos.cidade` sem criar novas
  abas.
- A validação DEV criou a ata `24a7ca23-62ed-4357-a7dd-108e6a0a7766` com
  `10` membros presentes, `5` partilhas, duas cidades, dois visitantes, dois
  ingressos com cidade e uma troca de ficha com quantidade `2`.
- A leitura agregada confirmou `membros_sem_localidade=3`,
  `total_ingressos=2`, `total_visitantes=2` e `total_trocas_chaveiro=2`.
- A duplicidade da mesma chave foi rejeitada sem alterar as contagens das abas.
- Após a migração, a DEV manteve diagnósticos em linhas antigas de `ingressos`
  sem cidade; esses registros históricos não participam dos indicadores.
