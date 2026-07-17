# Prompt para o Codex — estruturar Ciclo 2 do painel administrativo

Analise integralmente a pasta `docs/refatoracao-painel-administrativo/` e o código atual do projeto.

## Objetivo

Criar a documentação completa do **Ciclo 2**, mantendo o mesmo padrão do Ciclo 1.

O Ciclo 2 deve tratar das ações administrativas e dos estados operacionais que exigem mudanças além da camada visual:

- revisar a nomenclatura de “excluir” para “inativar”;
- criar e integrar uma ação real de reativação de grupos inativos, caso a arquitetura atual suporte isso com segurança;
- permitir ativar e inativar conforme o estado e a aba atual;
- adicionar confirmação antes da mudança de status;
- adicionar feedback de sucesso e erro;
- garantir revalidação das rotas afetadas;
- preservar autenticação e autorização no servidor;
- criar testes das Server Actions e dos fluxos de ativação/inativação;
- não alterar o contrato Sheets sem necessidade comprovada;
- não incluir o painel do responsável pelo grupo.

## Primeira tarefa: reconciliar a documentação

Antes de criar os novos documentos:

1. verifique o que já foi efetivamente implementado no Ciclo 1;
2. atualize o status real do `plano-executivo.md`;
3. atualize o `README.md`;
4. corrija divergências entre “implementação não iniciada”, tiros já validados e pendências reais;
5. não marque o Ciclo 1 como concluído se ainda houver tiros pendentes;
6. registre no `registro-execucao.md` somente fatos confirmados pelo código e testes.

## Documentos a criar

- `especificacao-ciclo-2.md`
- `execucao-ciclo-2.md`

Atualize, se necessário:

- `README.md`
- `plano-executivo.md`
- `checklist-validacao.md`
- `decisoes.md`
- `registro-execucao.md`

## Conteúdo obrigatório de `especificacao-ciclo-2.md`

1. Objetivo.
2. Estado atual após o Ciclo 1.
3. Fluxo atual de inativação.
4. Arquivos e Server Actions envolvidos.
5. Proposta de reativação.
6. Regras de autorização.
7. Confirmação.
8. Feedback de sucesso e erro.
9. Revalidação de rotas.
10. Estados da interface.
11. Impacto em front-end, back-end e Sheets.
12. Componentes afetados.
13. Contratos de dados usados.
14. Plano de testes.
15. Critérios de aceite.
16. Riscos.
17. Rollback.
18. Decisões pendentes.
19. Itens fora de escopo.

## Conteúdo obrigatório de `execucao-ciclo-2.md`

Divida em tiros pequenos:

### Tiro 1 — Diagnóstico e normalização
- revisar ações atuais;
- corrigir nomenclatura;
- mapear efeitos colaterais;
- confirmar revalidações.

### Tiro 2 — Reativação
- criar `activateGrupoAction`, se adequada;
- validar grupo;
- atualizar status;
- preservar contrato Sheets;
- revalidar rotas.

### Tiro 3 — Interface e feedback
- exibir ação correta conforme o estado;
- confirmação;
- loading;
- sucesso;
- erro;
- acessibilidade.

### Tiro 4 — Testes e regressão
- testes unitários;
- testes de Server Action;
- testes manuais;
- regressão;
- lint;
- test;
- build, separando erros preexistentes.

Para cada tiro, inclua objetivo, pré-condições, arquivos afetados, tarefas, critérios de aceite, testes, checkpoint, condição para avançar e rollback.

## Regras

- Não implementar código nesta etapa.
- Não criar migração.
- Não alterar schema.
- Não alterar autenticação sem necessidade.
- Não duplicar o Ciclo 1.
- Não tratar o painel do responsável.
- Não criar paginação ou filtros avançados.
- Verificar a implementação real em `src/lib/sheets/group-admin.ts`, `src/app/grupos/actions.ts` e dependências.
- Usar caminhos reais.
- Manter o plano executivo como visão macro.
- Manter a especificação como fonte técnica.
- Manter a execução como guia operacional.

## Entrega

Informe arquivos criados e atualizados, caminhos completos, quantidade de tiros, decisões tomadas, pendências, prompt curto para iniciar o Tiro 1, checkpoint antes do Tiro 2 e o status real do Ciclo 1.

Não inicie a implementação sem autorização explícita.
