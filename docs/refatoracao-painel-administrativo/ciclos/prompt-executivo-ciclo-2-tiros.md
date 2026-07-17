# Prompt executivo - executar Ciclo 2 em tiros

Use este prompt no Codex para executar o Ciclo 2 do painel administrativo de
grupos, respeitando os contratos documentados.

```text
Execute o Ciclo 2 do painel administrativo de grupos do GS Mapeamento, um tiro
por vez, sem avançar para o próximo tiro antes de validar e registrar o tiro
atual.

Leia primeiro:

- docs/refatoracao-painel-administrativo/plano-executivo.md
- docs/refatoracao-painel-administrativo/especificacao-ciclo-2.md
- docs/refatoracao-painel-administrativo/execucao-ciclo-2.md
- docs/refatoracao-painel-administrativo/checklist-validacao.md
- docs/refatoracao-painel-administrativo/decisoes.md
- docs/refatoracao-painel-administrativo/registro-execucao.md

Escopo do Ciclo 2:

- normalizar a nomenclatura de inativacao;
- implementar reativacao real de grupos inativos se confirmada como segura;
- exibir ativar ou inativar conforme o estado do grupo;
- usar confirmacao antes de alterar status;
- adicionar feedback de sucesso/erro;
- preservar autorizacao no servidor;
- preservar contrato Sheets e schemas;
- cobrir Server Actions e regressao com testes.

Fora de escopo:

- painel do responsavel;
- alteracao de contrato Sheets;
- migracao;
- filtros avancados;
- paginacao;
- paginas funcionais de Atas, Usuarios, Relatorios e Configuracoes;
- refatoracao completa para `/admin/*`, salvo se eu autorizar explicitamente.

Regra de execucao:

1. Execute somente o tiro solicitado.
2. Antes de editar, confirme no codigo real os arquivos envolvidos.
3. Ao terminar o tiro, rode os testes/checkpoints definidos.
4. Atualize `docs/refatoracao-painel-administrativo/registro-execucao.md`.
5. Atualize `docs/refatoracao-painel-administrativo/decisoes.md` se surgir
   decisao nova.
6. Atualize `docs/refatoracao-painel-administrativo/execucao-ciclo-2.md`
   marcando o tiro como validado apenas se os criterios forem cumpridos.
7. Nao avance para o proximo tiro sem minha autorizacao explicita.

Tiro 1 - Diagnostico e normalizacao:

- revisar `deleteGrupoAction`;
- confirmar que ela inativa grupo e horarios;
- corrigir qualquer nomenclatura visual remanescente de excluir para inativar;
- avaliar se deve criar alias `deactivateGrupoAction`;
- mapear revalidacoes atuais;
- confirmar efeitos colaterais sobre horarios;
- nao criar reativacao ainda.

Checkpoint do Tiro 1:

- nenhum texto visual fala em excluir grupo quando a acao e inativar;
- fluxo atual de inativacao confirmado;
- revalidacoes atuais documentadas;
- nenhuma mudanca em Sheets/schema/auth;
- `npm run lint` passa;
- `npm run test` passa;
- registro de execucao atualizado.

Tiro 2 - Reativacao:

- criar `activateGrupoAction`, se confirmada como adequada;
- exigir `requireAdminSession()`;
- validar existencia do grupo;
- salvar grupo com `ativo: true`;
- decidir e registrar regra de horarios na reativacao;
- revalidar `/`, `/grupos`, `/grupos/[grupoId]` e `/meu-grupo`;
- redirecionar com feedback definido;
- adicionar testes da Server Action.

Checkpoint do Tiro 2:

- grupo inexistente falha com erro controlado;
- grupo inativo passa para ativo;
- grupo ja ativo nao causa efeito destrutivo;
- contrato Sheets permanece inalterado;
- testes cobrem sucesso, grupo inexistente e revalidacoes;
- `npm run lint` passa;
- `npm run test` passa;
- registro de execucao atualizado.

Tiro 3 - Interface e feedback:

- exibir Inativar para grupo ativo;
- exibir Ativar para grupo inativo;
- aplicar cor azul/cinza-azulado ao botao de ativar;
- manter confirmacao antes da mudanca de status;
- adicionar feedback de sucesso e erro;
- preservar `aria-label`, `title`, foco e area de toque;
- garantir que a aba atual reflita o estado apos redirect/revalidacao.

Checkpoint do Tiro 3:

- grupo ativo mostra acao correta;
- grupo inativo mostra acao correta;
- ativar nao usa verde/vermelho;
- confirmacoes sao claras;
- feedback aparece apos acao;
- sem links quebrados;
- `npm run lint` passa;
- `npm run test` passa;
- registro de execucao atualizado.

Tiro 4 - Testes e regressao:

- revisar testes unitarios;
- garantir cobertura das Server Actions;
- testar regressao de criacao, duplicacao, edicao e horarios;
- rodar lint;
- rodar test;
- rodar build se a pendencia preexistente estiver resolvida; se nao estiver,
  registrar separadamente o erro conhecido em
  `scripts/reset-ata-record-sheets.ts:113`;
- atualizar registro de execucao com resultado final do Ciclo 2.

Checkpoint do Tiro 4:

- `npm run lint` passa;
- `npm run test` passa;
- build tem status claro: passou ou falhou por pendencia preexistente isolada;
- nenhuma mudanca de contrato Sheets;
- nenhuma regressao conhecida em `/grupos`, `/grupos/novo` e
  `/grupos/[grupoId]`;
- Ciclo 2 marcado como validado somente se os criterios forem cumpridos.

Comece pelo Tiro 1 apenas.
```

## Prompt curto para iniciar o Tiro 1

```text
Execute somente o Tiro 1 do Ciclo 2, seguindo docs/refatoracao-painel-administrativo/especificacao-ciclo-2.md e execucao-ciclo-2.md. Nao crie reativacao ainda; normalize nomenclatura, revise o fluxo atual e preserve Sheets/schema/auth.
```
