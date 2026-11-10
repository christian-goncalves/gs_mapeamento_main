# Diagnóstico de alterações locais aparentemente ausentes

## Objeto da investigação

Verificar se o checkout atual do GS Mapeamento contém alterações locais sem commit e explicar por que a interface poderia aparentar mostrar somente arquivos de documentação e Playwright.

## Contexto

O usuário esperava criar um commit e enviar as alterações ao GitHub, mas a visualização disponível parecia listar somente arquivos de Playwright e documentos. A investigação foi somente leitura do estado Git e arquivos de orientação; nenhuma alteração de código, stage, commit ou push foi realizada.

## Evidências examinadas

- Raiz Git: `/home/cg/Documentos/01-DEV/PROJETOS/gs-mapeamento` (`git rev-parse --show-toplevel`).
- Estado da branch e arquivos: `git status --short --branch`, `git status --porcelain=v1`, `git diff --stat`, `git diff --cached --stat` e `git diff --name-status`.
- Histórico: `git log -8 --oneline --decorate --all`, `git reflog -12 --date=iso`, `git show -s` e `git rev-list --left-right --count HEAD...@{u}`.
- Referências locais: `.gitignore` e `docs/README.md`.
- Verificação de whitespace: `git diff --check`.
- A instrução do contexto aponta `/home/cg/Documentos/01-DEV/PROJETOS/Apps/02-GS_Mapeamento/docs/`, mas esse checkout e diretório não existem nesta máquina. O projeto atual contém `docs/README.md`; o diretório `docs/desenvolvimento` também não existe.

## Estado observado

- Branch atual: `codex/teste-ios-date-mobile`, no commit `92fdf0f` (`fix: compatibiliza cabecalho atual de grupos`, 2026-11-10), acompanhando `origin/codex/teste-ios-date-mobile` sem commits à frente ou atrás.
- Há 25 entradas rastreadas com mudanças locais: 21 arquivos modificados e 4 removidos. Nenhuma mudança está staged.
- As mudanças rastreadas incluem código em `src/app`, `src/domain` e `src/lib`, testes em `src/lib/sheets`, documentação alterada e quatro documentos removidos.
- `git diff --stat` registra 976 inserções e 1.338 remoções nos arquivos rastreados.
- Existem 343 caminhos não rastreados: 335 em `.playwright-mcp/`, quatro em `docs/analise-diagnostico/`, três sob `public/` e um PDF em `src/lib/pdf/`.
- `.playwright-mcp/` não está ignorado pelo `.gitignore` do projeto; os arquivos aparecem como não rastreados.
- O índice está limpo; `git diff --cached --stat` não mostra conteúdo. `git diff --check` não reporta problemas.
- O reflog confirma que o commit mais recente ocorreu em 10/11/2026 às 15:00:37 -03. Depois dele, os arquivos locais atualmente modificados não foram registrados em commit. Não há entradas de stash.
- `origin` aponta para `https://github.com/christian-goncalves/gs_mapeamento_main.git`.

## Análise

O estado de trabalho não está limpo. Além das capturas e documentos, há alterações substanciais rastreadas no código-fonte e testes, que o Git apresenta como modificações e remoções normais. Portanto, a impressão de que só existem alterações em Playwright e documentação não corresponde ao estado deste checkout.

Como a branch local e sua referência remota estão no mesmo commit, as mudanças de código constatadas são locais e ainda não foram incluídas em commit. A contagem de centenas de capturas não rastreadas pode ocupar grande parte de uma lista visual de alterações; isso não elimina os arquivos `src/` modificados, que aparecem na saída integral do `git status`.

O destino indicado no texto de instruções do contexto é um caminho antigo ou indisponível neste ambiente. A raiz Git efetivamente aberta é `/home/cg/Documentos/01-DEV/PROJETOS/gs-mapeamento`.

## Hipóteses avaliadas

- **Hipótese de que não há alterações de código:** descartada. `git status` lista 21 arquivos rastreados modificados, incluindo arquivos sob `src/`.
- **Hipótese de que as alterações já estão staged ou foram commitadas:** descartada para o estado atual. O índice está limpo e o reflog não registra commit posterior ao de 15:00:37.
- **Hipótese de que capturas Playwright dominam a lista visual:** sustentada como explicação possível para a percepção, pois 335 dos 343 caminhos não rastreados estão nesse diretório; a interface específica que produziu a visualização não foi examinada.
- **Hipótese de que outro checkout seja a raiz atualmente aberta:** descartada para esta sessão, pois `git rev-parse` identifica a raiz efetiva; o caminho antigo referido nas instruções não existe no ambiente.

## Diagnóstico

Há alterações locais aptas a serem consideradas para um commit: 21 arquivos rastreados modificados, quatro removidos e arquivos novos, incluindo documentação, PDFs e capturas. O usuário não precisa reconstruir as alterações de código a partir do histórico: elas estão presentes no checkout atual. Nada está staged, e nenhuma alteração foi commitada ou enviada por esta investigação.

## Grau de certeza

Alto quanto à existência, localização e situação Git das alterações, comprovadas diretamente por `git status`, diffs, branch e reflog. Médio quanto à razão exata da visualização mostrar somente parte delas, pois a interface que a gerou não foi inspecionada.

## Pontos ainda não comprovados

- Se havia alterações não salvas no editor; o Git só detecta o conteúdo gravado nos arquivos.
- Qual filtro ou interface apresentou somente parte das mudanças.
- Quais arquivos não rastreados são desejados para o futuro commit; este diagnóstico não os adicionou ao índice.
