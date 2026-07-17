# Documentação do GS Mapeamento

Este diretório contém as fontes canônicas do produto, domínio, arquitetura e
execução do MVP.

## Ordem de leitura

1. [Escopo do MVP](produto/escopo-mvp.md)
2. [Backlog de produto](produto/backlog.md)
3. [Contrato de Informações Gerais](produto/contratos/informacoes-gerais.md)
4. [Contrato de Participação](produto/contratos/participacao.md)
5. [Arquitetura de dados](arquitetura/arquitetura-de-dados.md)
6. [Plano de desenvolvimento](desenvolvimento/plano-de-desenvolvimento.md)
7. [Checklist executivo](desenvolvimento/checklist-executivo.md)

## Mapa das fontes canônicas

| Assunto | Documento |
| --- | --- |
| Escopo, decisões e exclusões | [Escopo do MVP](produto/escopo-mvp.md) |
| Ideias futuras e pendências de produto | [Backlog de produto](produto/backlog.md) |
| Campos e regras de Informações Gerais | [Contrato de Informações Gerais](produto/contratos/informacoes-gerais.md) |
| Campos e regras de Participação | [Contrato de Participação](produto/contratos/participacao.md) |
| Persistência, integridade e Sheets | [Arquitetura de dados](arquitetura/arquitetura-de-dados.md) |
| Representação visual do modelo | [Modelo DBML](arquitetura/modelo-de-dados.dbml) |
| Ambiente, OAuth e segredos | [Ambiente local](desenvolvimento/ambiente-local.md) |
| Fases e critérios de aceite | [Plano de desenvolvimento](desenvolvimento/plano-de-desenvolvimento.md) |
| Tarefas e estado da execução | [Checklist executivo](desenvolvimento/checklist-executivo.md) |
| Marcos já concluídos | [Histórico](projeto/historico.md) |
| Refatoração do painel administrativo | [Índice da refatoração](refatoracao-painel-administrativo/README.md) |

## Referências

- [Visualização do modelo](arquitetura/visualizacao-do-modelo.md)
- [Formulário legado do Jotform](referencias/formulario-legado/jotform.html)
- [Captura de Informações Gerais](referencias/formulario-legado/informacoes-gerais.png)
- [Captura de Participação](referencias/formulario-legado/participacao.png)

Os arquivos do Jotform são exclusivamente visuais. Eles não definem campos,
valores ou regras de negócio.

## Convenções

- Arquivos e pastas usam ASCII em `kebab-case`.
- Cada Markdown possui um único título `# H1`.
- Links internos são relativos ao documento de origem.
- Decisões de negócio pertencem a `produto/`.
- Ideias futuras ficam em `produto/backlog.md` ate virarem plano aprovado.
- Regras técnicas e de persistência pertencem a `arquitetura/`.
- Fases e tarefas pertencem a `desenvolvimento/`.
- Fatos passados pertencem a `projeto/historico.md`.
- Somente o checklist usa `[x]`, `[ ]` e `[!]` para representar estado.
