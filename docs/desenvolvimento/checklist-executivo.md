# Checklist executivo

Este checklist é o roteiro operacional do MVP. A ordem é obrigatória: uma etapa
só avança quando seus critérios de aceite estiverem atendidos. Alterações de
escopo devem ser registradas no [Escopo do MVP](../produto/escopo-mvp.md) antes
da implementação. As fases e critérios gerais estão no
[Plano de desenvolvimento](plano-de-desenvolvimento.md).

Legenda: `[x]` concluído, `[ ]` pendente, `[!]` bloqueado.

## Fase 1 — Contrato e modelo

- [x] Harmonizar contratos das entidades iniciais.
- [x] Criar DBML e estruturar as abas iniciais do Google Sheets.
- [x] Migrar grupos para UUID e preservar `zoom_id`.

## Fase 2 — Fundação

- [x] Proteger segredos locais e remover JSONs de credenciais.
- [x] Inicializar Next.js App Router com TypeScript.
- [x] Implementar Auth.js com Google e lista permitida.
- [x] Validar login real e leitura dos grupos ativos.
- [x] Criar schemas iniciais e testes básicos do domínio.
- [x] Registrar decisões de imutabilidade, duplicidade, municípios e testes.

## Fase 3 — Contratos executáveis

- [x] Separar schemas de formulário, domínio e linhas persistidas.
- [x] Criar schemas positivos e negativos para as seis entidades.
- [x] Implementar mapa entre códigos internos e rótulos portugueses do Sheets.
- [x] Aplicar `Zoom` como validação controlada de `atas.plataforma` no Sheets.
- [x] Exigir estado para Brasil e estado vazio para outros países.
- [x] Validar IDs únicos e ordens únicas por contexto.
- [x] Validar grupo existente e ativo durante a criação.
- [x] Permitir leitura histórica de atas vinculadas a grupos inativos.
- [x] Corrigir preservação do número real da linha quando houver linhas vazias.

Critério de aceite:

- [x] Cada regra documental possui teste isolado.
- [x] Uma linha válida do Sheets é aceita e uma inválida informa aba, linha e
  campo.

### Municípios brasileiros

- [x] Criar script que consulte a API de Localidades do IBGE.
- [x] Gerar JSON mínimo com `id`, `nome` e `uf`.
- [x] Validar IDs únicos, 27 UFs e campos obrigatórios.
- [x] Ordenar deterministicamente e registrar fonte/data da atualização.
- [x] Implementar busca normalizada por nome e UF.
- [x] Exibir opções no formato `Nome - UF`.
- [x] Validar no backend usando o mesmo JSON.

Critério de aceite:

- [x] Município ausente da base é rejeitado.
- [x] O autocomplete funciona sem chamada externa em tempo de execução.

## Fase 4 — Leitura agregada

- [x] Ler e validar as abas vigentes na fase.
- [x] Reconstruir ata completa por `ata_id`.
- [x] Validar todas as referências entre abas.
- [x] Separar registros válidos e inválidos.
- [x] Calcular indicadores somente com registros válidos.
- [x] Exibir detalhe de ata em modo somente leitura.

Critério de aceite:

- [x] Edição manual inválida não entra em indicadores e produz diagnóstico
  localizado.

## Fase 5 — Criação imutável

- [x] Construir formulário com Informações Gerais e Participação.
- [x] Manter o rascunho somente no navegador.
- [x] Permitir adicionar, reordenar e remover dependentes antes do envio.
- [x] Exibir resumo completo em diálogo de confirmação.
- [x] Revalidar autorização e domínio na Server Action.
- [x] Gerar UUIDs e timestamps no backend.
- [x] Consultar duplicidade por `grupo_id + data_reuniao + hora_inicio`.
- [x] Desabilitar confirmação durante a requisição.
- [x] Gravar ata e dependentes em um único `spreadsheets.batchUpdate`.
- [x] Retornar sucesso somente após confirmação da API.
- [x] Não disponibilizar edição ou exclusão após o envio.

Critério de aceite:

- [x] Cancelar o resumo não grava dados.
- [x] Falha em qualquer suboperação não grava nenhuma linha.
- [x] Reenvio da mesma chave é rejeitado.
- [ ] Ata enviada aparece na listagem e no detalhe somente leitura em validação
  funcional com Google Sheets.

## Fase 6 — Política de edição manual

- [x] Adicionar `MANUAL_SHEETS_EDIT_ENABLED=true` ao contrato de ambiente.
- [x] Ler proteções e IDs das abas vigentes na fase.
- [x] Criar reconciliação administrativa idempotente.
- [x] Com `true`, manter edição manual.
- [x] Com `false`, aplicar proteção permitindo escrita da conta de serviço.
- [x] Documentar que o proprietário administra e pode remover proteções.

Critério de aceite:

- [x] Executar a reconciliação repetidamente não duplica proteções.
- [x] A configuração declarada corresponde ao estado real das abas.

## Fase 7 — Validação e implantação

- [x] Reconciliar contrato estrutural de DEV com sete abas.
- [x] Reconciliar contrato estrutural de PROD com sete abas.
- [x] Confirmar `ingressos`, `atas.total_partilhas` e
  `trocas_chaveiro.quantidade` em DEV e PROD.
- [x] Executar lint, testes e build após a refatoração ATA Full.
- [x] Validar criação real de ata em DEV, com participação, visitante,
  ingresso e troca com quantidade.
- [x] Confirmar listagem e detalhe da ata criada em modo somente leitura.
- [ ] Testar duplicidade e duplo clique em DEV.
- [ ] Testar usuário permitido e usuário bloqueado.
- [ ] Testar autorização em cada leitura e Server Action.
- [ ] Testar falha atômica sem escrita parcial.
- [ ] Rotacionar a chave da conta de serviço antes da implantação.
- [ ] Configurar segredos e callback OAuth na Vercel.
- [ ] Repetir fluxo mínimo validado em produção.

Critério de aceite:

- [ ] MVP opera somente para usuários autorizados, sem banco local, sem Jotform,
  sem segredo no navegador e sem sucesso falso.

## Refatoracao ATA Full — 23 de junho de 2026

- [x] TIRO 1: diagnostico documentado sem alterar `src/`.
- [x] TIRO 1: `npm test`, `npm run lint` e `npm run build` aprovados.
- [x] TIRO 2: backend full com `total_partilhas`, `ingressos`,
  `trocas_chaveiro.quantidade` e novos codigos de `tempo_limpo`.
- [x] TIRO 2: contrato Sheets, DBML, docs, scripts, leitura agregada, escrita
  atomica, listagem e detalhe atualizados.
- [x] TIRO 2: `npm test`, `npm run lint` e `npm run build` aprovados.
- [x] TIRO 3: frontend hidden conectado ao backend full.
- [x] TIRO 3: Server Action aceita payload hidden e normaliza para o contrato
  full.
- [x] TIRO 3: anonimato persiste `Anonimo`, visitantes recebem defaults
  ocultos e participacao deriva UF/pais da localidade controlada.
- [x] TIRO 3: caso real com 20 presentes calcula `membros_sem_localidade=5`.
- [x] TIRO 3: `npm test`, `npm run lint` e `npm run build` aprovados.
- [x] Reconciliação Sheets: DEV e PROD atualizadas para o contrato ATA Full com
  sete abas.
