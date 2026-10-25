# Diagnóstico da rota e do botão Relatórios Azul

## Objeto da investigação

Investigar o desaparecimento do botão que deveria abrir `Relatórios Azul` e o
retorno HTTP 404 em `/responsavel/relatorios-azul` no ambiente local.

## Contexto

O sintoma foi apresentado por captura de tela do navegador em
`http://localhost:3000/responsavel/relatorios-azul`. A tela mostra a página
normal de Relatórios em uma área e, para a rota azul, a mensagem `404 This page
could not be found.`.

## Evidências examinadas

- Checkout local em `/home/cg/Documentos/01-DEV/PROJETOS/gs-mapeamento`, branch
  atual `main`, commit `194b89e`.
- `src/app/navigation-config.ts` no checkout atual, linhas 31–50.
- `src/app/responsavel/responsavel-shell.tsx` no checkout atual, linhas 26–83.
- `src/app/responsavel/relatorios/page.tsx` no checkout atual, linhas 54–79.
- Árvore da branch publicada `codex/revisao-estado-2026-10-25`.
- `src/app/responsavel/relatorios/page.tsx` da branch publicada, linhas 80–90.
- `src/app/responsavel/relatorios-azul/page.tsx` da branch publicada.
- Busca histórica por `relatorios-azul` e `Relatórios Azul`.
- Respostas HTTP locais: `/responsavel/relatorios` retornou 307 e
  `/responsavel/relatorios-azul` retornou 404.
- Captura de tela fornecida na conversa.

## Estado observado

No checkout atual, `src/app/responsavel/relatorios-azul/` não existe na árvore
do commit `HEAD`.

No checkout atual, `responsavelNavigationItems()` declara somente três itens
para o responsável: `Configurações`, `Histórico de Atas` e `Relatórios`. Não há
item ou texto `Relatórios Azul` em `src/app/navigation-config.ts`.

No checkout atual, a página `src/app/responsavel/relatorios/page.tsx` renderiza
`MonthlyGroupDashboard` sem uma ação adicional para abrir a página azul.

Na branch publicada `codex/revisao-estado-2026-10-25`, existem os arquivos
`src/app/responsavel/relatorios-azul/page.tsx` e
`src/app/responsavel/relatorios-azul/static-report-fixture.ts`.

Na mesma branch publicada, `src/app/responsavel/relatorios/page.tsx` contém um
`headerAction` com link para `/responsavel/relatorios-azul`, entre as linhas 80
e 90.

Na branch publicada, a rota azul usa `ResponsavelShell` e apresenta uma página
estática de comparação visual, com o texto `Comparação visual estática.`.

## Análise

O erro 404 é compatível com o estado do código que está sendo servido: a rota
do App Router depende da existência de `src/app/responsavel/relatorios-azul/page.tsx`,
mas esse diretório não existe no `HEAD` do checkout atual.

O botão não desapareceu por uma condição de sessão, filtro ou permissão. O
trecho que o renderizava está presente somente na branch publicada de revisão,
não no `main` atual.

A diferença entre as branches explica os dois sintomas em conjunto: a branch
de revisão contém a implementação da página e o link de acionamento; o
checkout `main`, usado pelo servidor local observado, contém apenas o relatório
normal.

## Hipóteses avaliadas

### Branch/checkout diferente do esperado — sustentada

A rota e o botão aparecem na árvore da branch publicada, enquanto ambos estão
ausentes no `HEAD` atual. Essa evidência explica simultaneamente o 404 e a
ausência do botão.

### Falha de autenticação ou permissão — enfraquecida

O status 404 e a ausência física da rota no checkout atual apontam para rota não
compilada, não para redirecionamento de sessão. A rota comum responde 307,
enquanto a rota azul responde 404.

### Rota removida por erro de navegação — não confirmada

Não há evidência de que a rota tenha sido removida da branch publicada. O que se
observa é que ela está em uma branch diferente da atualmente servida.

## Diagnóstico

O botão e a página `Relatórios Azul` foram desenvolvidos na branch
`codex/revisao-estado-2026-10-25`, commit `69be891`, mas o servidor local está
rodando o checkout `main` no commit `194b89e`. Como `main` não contém a pasta
da rota nem o `headerAction` do botão, `/responsavel/relatorios-azul` retorna
404 e o botão não aparece na página comum.

## Grau de certeza

Alto. A ausência da rota e do link foi verificada diretamente na árvore do
checkout atual, a presença de ambos foi verificada na branch publicada, e os
status HTTP locais reproduzem o sintoma informado.

## Pontos ainda não comprovados

- Não foi feita alteração de código nem troca do checkout durante esta análise.
- Não foi executado build, lint ou teste automatizado porque `node`/`npm` não
  estão disponíveis neste ambiente.
