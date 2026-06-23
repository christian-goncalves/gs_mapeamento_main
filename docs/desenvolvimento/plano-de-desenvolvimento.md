# Plano de desenvolvimento

## Objetivo

Entregar o MVP definido no [escopo](../produto/escopo-mvp.md), usando a
[arquitetura de dados](../arquitetura/arquitetura-de-dados.md) e o Google Sheets
como persistência oficial.

O estado das tarefas pertence exclusivamente ao
[checklist executivo](checklist-executivo.md).

## Fase 1 — Contrato e modelo

Harmonizar contratos, DBML, cabeçalhos e validações das abas do contrato.

Critério de aceite: documentos e Sheets descrevem as mesmas entidades, campos,
valores e relações.

## Fase 2 — Fundação

Inicializar Next.js, Auth.js, autorização server-side, adaptador do Sheets e
schemas iniciais.

Critério de aceite: usuário permitido acessa o painel, usuário não permitido é
bloqueado e nenhum segredo chega ao navegador.

## Fase 3 — Contratos executáveis

Separar schemas de formulário, domínio e persistência; implementar mapeamentos,
integridade referencial, municípios do IBGE e diagnósticos de linhas inválidas.

Critério de aceite: dados válidos são gravados e relidos sem perda; valores
inválidos informam aba, linha e campo.

## Fase 4 — Leitura agregada

Reconstruir atas completas pelas abas do contrato e calcular indicadores somente com
registros válidos.

Critério de aceite: listagem e detalhe somente leitura representam a planilha e
isolam edições manuais inválidas.

## Fase 5 — Criação imutável

Construir formulário, resumo, deduplicação e gravação atômica da ata e seus
dependentes.

Critério de aceite: cancelamento não grava; falha parcial não deixa linhas;
reenvio é rejeitado; ata confirmada não pode ser editada ou excluída pela
aplicação.

## Fase 6 — Política de edição manual

Implementar reconciliação idempotente das proteções das abas do contrato conforme a
configuração server-only.

Critério de aceite: estado real das proteções corresponde à configuração e o
proprietário mantém capacidade administrativa.

## Fase 7 — Validação e implantação

Executar testes unitários, integração em planilha exclusiva, build, configuração
da Vercel e fluxo completo em produção.

Critério de aceite: o MVP opera somente para usuários autorizados, sem banco
local, sem dependência do Jotform e sem sucesso falso.

## Refatoração UX — contrato operacional da ata

Reorganizar a tela de criação sem alterar a imutabilidade: Participação passa a
conter somente totais, `Localidade - Cidades (UF)` concentra cidades e
quantidades, visitantes e ingressos usam `Anonimo` por padrão com cidade
obrigatória, ingressos persistem cidade e a interface passa a usar `Troca de
ficha`.

Critério de aceite: documentação, contrato Sheets, criação, leitura, detalhe,
resumo de confirmação e validação DEV representam o mesmo contrato.
