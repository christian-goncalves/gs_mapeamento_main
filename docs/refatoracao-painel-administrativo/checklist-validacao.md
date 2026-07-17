# Checklist de validacao - painel administrativo

Use este checklist apos cada tiro.

## Rota e autenticacao

- [ ] `/admin/grupos` carrega para administrador.
- [ ] Usuario nao administrador nao acessa `/admin/grupos`.
- [ ] `/admin/grupos/novo` continua acessivel para administrador.
- [ ] `/admin/grupos/[grupoId]` continua carregando para administrador.
- [ ] `/grupos` redireciona para `/admin/grupos`.
- [ ] `/grupos/novo` redireciona para `/admin/grupos/novo`.
- [ ] `/grupos/[grupoId]` redireciona administrador para `/admin/grupos/[grupoId]`.
- [ ] `/grupos/[grupoId]` continua carregando para responsavel autorizado.
- [ ] Nenhuma regra de autenticacao foi alterada sem decisao registrada.

## Dados

- [ ] Dados exibidos vem de `readAggregatedAtas()`.
- [ ] Nao ha dados mockados.
- [ ] Contadores de ativos, inativos e total batem com `result.grupos`.
- [ ] Grupos inativos aparecem somente nas abas corretas.
- [ ] Diagnosticos existentes continuam visiveis ou preservados.

## Interface

- [ ] Sidebar mostra Grupos ativo.
- [ ] Itens de secoes futuras navegam para placeholders protegidos.
- [ ] Sidebar tem comportamento validado em desktop.
- [ ] Sidebar tem comportamento validado em tablet.
- [ ] Sidebar tem comportamento validado em mobile.
- [ ] Sidebar compacta preserva `aria-label` e `title`.
- [ ] Botao `Novo grupo` aponta para `/admin/grupos/novo`.
- [ ] Aba Ativos abre por padrao.
- [ ] Abas Ativos/Inativos/Todos filtram corretamente.
- [ ] Busca combina com a aba ativa.
- [ ] Estado sem resultados aparece.
- [ ] Estado de lista vazia aparece.
- [ ] Nao ha overflow horizontal.
- [ ] Nomes longos de grupos nao quebram o layout.
- [ ] Acoes mobile continuam visiveis ou decisao alternativa foi registrada.

## Acoes

- [ ] Visualizar/Editar usa rota real.
- [ ] Duplicar continua chamando `duplicateGrupoAction`.
- [ ] Inativar chama `deactivateGrupoAction`.
- [ ] Inativar exige confirmacao.
- [ ] No Ciclo 1, nao ha acao de reativar.
- [ ] No Ciclo 2, grupo inativo chama `activateGrupoAction`.
- [ ] No Ciclo 2, ativar exige confirmacao.
- [ ] No Ciclo 2, ativar usa cor distinta de verde/vermelho.
- [ ] Acoes usam icones com `aria-label`.
- [ ] Botoes mantem area de toque adequada.

## Acessibilidade

- [ ] Busca tem label.
- [ ] Tabs tem semantica acessivel.
- [ ] Tabs aceitam navegacao por teclado.
- [ ] Foco visivel funciona.
- [ ] Tooltips basicos existem via `title`.
- [ ] Contraste permanece legivel.
- [ ] Navegacao por teclado nao fica bloqueada.
- [ ] Feedback usa `role="status"` quando apropriado.
- [ ] Loading/erro tem decisao registrada no Ciclo 3.

## Regressao

- [ ] Home `/` redireciona por perfil.
- [ ] Formulario `/atas/nova` continua carregando.
- [ ] Detalhe de ata `/atas/[ataId]` continua carregando.
- [ ] Painel do responsavel nao foi alterado.
- [ ] Nenhum schema foi alterado.
- [ ] Nenhum contrato Sheets foi alterado.
- [ ] Nenhuma migracao foi criada.

## Comandos

- [ ] `npm run lint` passou.
- [ ] `npm run test` passou.

## Registro

- [ ] `registro-execucao.md` foi atualizado.
- [ ] `decisoes.md` foi atualizado, se houve decisao nova.
