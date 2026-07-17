# Prompt para o Codex — estruturar Ciclo 3 do painel administrativo

Analise integralmente a documentação em `docs/refatoracao-painel-administrativo/` e o código atual.

O Ciclo 3 só deve ser especificado após verificar o estado real dos Ciclos 1 e 2.

## Objetivo

Criar a documentação completa do **Ciclo 3**, dedicada ao refinamento responsivo, acessibilidade, estados de carregamento e acabamento do painel administrativo.

O escopo esperado inclui:

- comportamento definitivo da sidebar em desktop, tablet e mobile;
- redução para ícones quando a largura diminuir;
- avaliação de drawer, sidebar colapsada ou navegação compacta;
- tooltips e `aria-label` em todas as ações por ícone;
- foco visível;
- navegação por teclado;
- semântica correta das tabs;
- tamanho mínimo de toque;
- tratamento de nomes longos;
- prevenção de overflow horizontal;
- comportamento das ações em telas pequenas;
- decisão entre ícones visíveis e menu de três pontos;
- estados de loading, erro, vazio e operação em andamento;
- eventual `loading.tsx`, se justificada;
- revisão visual de espaçamentos, cards, hierarquia e consistência;
- avaliação de paginação apenas se o volume real justificar;
- testes em desktop, tablet e mobile.

## Primeira tarefa: verificar dependências

1. confirme o status dos Ciclos 1 e 2;
2. identifique o que já foi implementado em responsividade e acessibilidade;
3. não recrie trabalho concluído;
4. atualize plano executivo e README se necessário;
5. registre decisões anteriores que impactam este ciclo;
6. destaque bloqueios abertos.

## Documentos a criar

- `especificacao-ciclo-3.md`
- `execucao-ciclo-3.md`

Atualize, se necessário:

- `README.md`
- `plano-executivo.md`
- `checklist-validacao.md`
- `decisoes.md`
- `registro-execucao.md`

## Conteúdo obrigatório de `especificacao-ciclo-3.md`

1. Objetivo.
2. Estado atual após ciclos anteriores.
3. Inventário dos componentes.
4. Estratégia responsiva.
5. Sidebar por breakpoint.
6. Listagem por breakpoint.
7. Estratégia para ações no mobile.
8. Acessibilidade.
9. Estados de carregamento e erro.
10. Necessidade ou não de `loading.tsx`.
11. Tooltips.
12. Teclado e foco.
13. Semântica das tabs.
14. Tokens e estilos.
15. Arquivos afetados.
16. Testes.
17. Critérios de aceite.
18. Riscos.
19. Rollback.
20. Decisões pendentes.
21. Itens fora de escopo.

## Conteúdo obrigatório de `execucao-ciclo-3.md`

### Tiro 1 — Sidebar responsiva
- desktop;
- tablet;
- mobile;
- itens ativos e desabilitados;
- Sair;
- tooltips.

### Tiro 2 — Lista e ações mobile
- cards;
- nomes longos;
- ações por ícone;
- decisão sobre menu de três pontos;
- área de toque;
- sem overflow.

### Tiro 3 — Acessibilidade e estados
- tabs;
- foco;
- teclado;
- `aria-label`;
- loading;
- erro;
- vazio;
- ação em andamento.

### Tiro 4 — Refinamento e regressão
- revisão visual;
- desktop;
- tablet;
- mobile;
- lint;
- testes;
- build;
- regressão.

Para cada tiro, inclua objetivo, pré-condições, arquivos afetados, tarefas, critérios de aceite, testes, checkpoint, condição para avançar e rollback.

## Paginação

Não implementar automaticamente. Primeiro medir o volume real, verificar `readAggregatedAtas()`, avaliar valor e registrar recomendação.

## Regras

- Não implementar código nesta etapa.
- Não duplicar funcionalidades concluídas.
- Não alterar contrato Sheets.
- Não criar migração.
- Não modificar o painel do responsável.
- Não criar páginas funcionais de Atas, Usuários, Relatórios ou Configurações.
- Não inventar breakpoints sem revisar `globals.css`.
- Não esconder ações essenciais no mobile.
- Usar o código real como fonte principal.

## Entrega

Informe arquivos criados e atualizados, caminhos completos, quantidade de tiros, estratégia da sidebar, estratégia das ações mobile, pendências, prompt curto para o Tiro 1, checkpoint antes do Tiro 2 e status consolidado dos três ciclos.

Não inicie a implementação sem autorização explícita.
