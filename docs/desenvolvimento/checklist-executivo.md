# Checklist executivo

Este checklist é o roteiro operacional do MVP. A ordem é obrigatória: uma etapa
só avança quando seus critérios de aceite estiverem atendidos. Alterações de
escopo devem ser registradas no [Escopo do MVP](../produto/escopo-mvp.md) antes
da implementação. As fases e critérios gerais estão no
[Plano de desenvolvimento](plano-de-desenvolvimento.md).

Legenda: `[x]` concluído, `[ ]` pendente, `[!]` bloqueado.

## Fase 1 — Contrato e modelo

- [x] Harmonizar contratos das seis entidades.
- [x] Criar DBML e estruturar as seis abas do Google Sheets.
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

- [ ] Ler e validar as seis abas.
- [ ] Reconstruir ata completa por `ata_id`.
- [ ] Validar todas as referências entre abas.
- [ ] Separar registros válidos e inválidos.
- [ ] Calcular indicadores somente com registros válidos.
- [ ] Exibir detalhe de ata em modo somente leitura.

Critério de aceite:

- [ ] Edição manual inválida não entra em indicadores e produz diagnóstico
  localizado.

## Fase 5 — Criação imutável

- [ ] Construir formulário com Informações Gerais e Participação.
- [ ] Manter o rascunho somente no navegador.
- [ ] Permitir adicionar, reordenar e remover dependentes antes do envio.
- [ ] Exibir resumo completo em diálogo de confirmação.
- [ ] Revalidar autorização e domínio na Server Action.
- [ ] Gerar UUIDs e timestamps no backend.
- [ ] Consultar duplicidade por `grupo_id + data_reuniao + hora_inicio`.
- [ ] Desabilitar confirmação durante a requisição.
- [ ] Gravar ata e dependentes em um único `spreadsheets.batchUpdate`.
- [ ] Retornar sucesso somente após confirmação da API.
- [ ] Não disponibilizar edição ou exclusão após o envio.

Critério de aceite:

- [ ] Cancelar o resumo não grava dados.
- [ ] Falha em qualquer suboperação não grava nenhuma linha.
- [ ] Reenvio da mesma chave é rejeitado.
- [ ] Ata enviada aparece na listagem e no detalhe somente leitura.

## Fase 6 — Política de edição manual

- [x] Adicionar `MANUAL_SHEETS_EDIT_ENABLED=true` ao contrato de ambiente.
- [ ] Ler proteções e IDs das seis abas.
- [ ] Criar reconciliação administrativa idempotente.
- [ ] Com `true`, manter edição manual.
- [ ] Com `false`, aplicar proteção permitindo escrita da conta de serviço.
- [ ] Documentar que o proprietário administra e pode remover proteções.

Critério de aceite:

- [ ] Executar a reconciliação repetidamente não duplica proteções.
- [ ] A configuração declarada corresponde ao estado real das abas.

## Fase 7 — Validação e implantação

- [ ] Criar planilha exclusiva de testes com as seis abas.
- [ ] Configurar `GOOGLE_SHEETS_TEST_ID` fora do repositório.
- [ ] Testar schemas, mapeamentos, referências e indicadores.
- [ ] Testar usuário permitido e usuário bloqueado.
- [ ] Testar autorização em cada leitura e Server Action.
- [ ] Testar gravação atômica e falhas da API.
- [ ] Testar duplicidade e duplo clique.
- [ ] Executar lint, TypeScript, testes e build.
- [ ] Rotacionar a chave da conta de serviço antes da implantação.
- [ ] Configurar segredos e callback OAuth na Vercel.
- [ ] Executar o fluxo completo em produção.

Critério de aceite:

- [ ] MVP opera somente para usuários autorizados, sem banco local, sem Jotform,
  sem segredo no navegador e sem sucesso falso.
