# Diagnóstico do tamanho do checkout

## Objeto da investigação

Identificar quais diretórios explicam o tamanho de aproximadamente 1 GB observado no checkout `gs-mapeamento` e distinguir dados reconstruíveis de conteúdo que exige revisão antes de qualquer remoção.

## Contexto

Inspeção local somente leitura em 2026-11-01. A medição foi feita na raiz Git `/home/cg/Documentos/01-DEV/PROJETOS/gs-mapeamento`, incluindo diretórios ocultos e sem atravessar outros sistemas de arquivos (`du -x`). Nenhum arquivo foi removido ou alterado durante a inspeção.

## Evidências examinadas

- `du -x -B1 --max-depth=1 .`: total e tamanho alocado dos diretórios de primeiro nível.
- `du -x -h --max-depth=3 .next node_modules docs artifacts .playwright-mcp .git`: detalhamento dos maiores diretórios.
- `find . -xdev -type f ... | sort -nr | head -35`: arquivos individuais de maior tamanho.
- `git status --short --branch`, `git ls-files` e `git check-ignore`: estado do worktree e distinção entre conteúdo rastreado e ignorado.
- `.gitignore` e `package.json`: regras para `.next`/`node_modules` e dependências declaradas.
- `docs/README.md`: documentação local disponível; lista referências para a refatoração front-end.
- Caminho de diretrizes indicado pelo `AGENTS.md`: `/home/cg/Documentos/01-DEV/PROJETOS/Apps/02-GS_Mapeamento/docs/`; não foram encontrados arquivos nesse caminho durante a listagem.

## Estado observado

O tamanho alocado na raiz é **1.233.489.920 bytes**, cerca de **1,23 GB** (ou **1,15 GiB**). Os principais diretórios são:

| Diretório | Tamanho aproximado | Estado observado |
|---|---:|---|
| `node_modules/` | 629 MiB | Ignorado pelo Git; dependências declaradas em `package.json`; contém binários de Next, TypeScript e outras ferramentas. |
| `.next/` | 369 MiB | Ignorado pelo Git; contém build/cache local. `.next/dev/` ocupa 317 MiB, dos quais 257 MiB estão em `cache/webpack`. |
| `.git/` | 97 MiB | Metadados e histórico Git; o pack de objetos tem aproximadamente 10 MiB e `objects/` no total cerca de 96 MiB. |
| `docs/` | 70 MiB | Conteúdo rastreado pelo Git; quase todo o volume está em `docs/Painel de NA no Brasil (Copy)/ppt/`. |
| `.playwright-mcp/` | 5,7 MiB | Diretório misto: 176 arquivos rastreados e 34 arquivos não rastreados reportados no worktree. |
| `artifacts/` | 3,8 MiB | Parte do conteúdo aparece rastreada pelo Git; há dados de simulação. |

O total de `node_modules/` e `.next/` é aproximadamente **998 MiB**, ou cerca de **81%** do tamanho medido. Os maiores arquivos isolados são um binário nativo do Next com 130 MB, caches Webpack entre aproximadamente 18–29 MB, um binário nativo do Rolldown com 22 MB e arquivos do pacote de dependências `sharp`.

O worktree está na branch `codex/revisao-estado-2026-10-25` e tem alterações locais: dois arquivos TSX modificados, 34 arquivos não rastreados em `.playwright-mcp/` e quatro caminhos não rastreados sob `docs/` (incluindo este diagnóstico).

## Análise

`node_modules/` e `.next/` explicam praticamente todo o excedente de tamanho. O `.gitignore` confirma que ambos são locais e ignorados; `package.json` registra as dependências necessárias para reconstruir `node_modules/`, e `.next/` contém saída/cache gerada pelo Next.js. Portanto, são os candidatos claros a liberar espaço local, desde que se aceite reinstalar dependências e regenerar o build/cache quando necessário. A medição não demonstra se algum processo está usando esses diretórios neste momento.

O volume em `docs/Painel de NA no Brasil (Copy)/ppt/` é conteúdo versionado, com 28 arquivos e diversos arquivos de texto de 2,5–4,9 MB. Não há evidência suficiente nesta inspeção para concluir que sejam duplicatas descartáveis ou irrelevantes ao projeto. O nome “Copy” sugere uma cópia, mas isso, isoladamente, não prova que possa ser removida.

`.playwright-mcp/` não deve ser tratado como cache descartável em bloco: parte substancial está rastreada. Além disso, o estado atual contém arquivos locais não rastreados que podem ser evidências de trabalho. `.git/` guarda o histórico e não é uma pasta de build; apagá-la destruiria o repositório local. `artifacts/` é pequeno e parte dele também está rastreada.

## Hipóteses avaliadas

- **Cache e dependências locais explicam a maior parte do 1 GB — sustentada.** As medições somam aproximadamente 998 MiB para `node_modules/` e `.next/`, ambos ignorados pelo Git.
- **Os 70 MiB de `docs/` são lixo duplicado — não comprovada.** O material é rastreado e seu conteúdo/função não foi validado; o nome do diretório não basta para determinar redundância.
- **Todo `.playwright-mcp/` pode ser apagado — descartada.** 176 arquivos estão rastreados pelo Git e há outros arquivos locais não rastreados.

## Diagnóstico

O checkout mede aproximadamente **1,23 GB** principalmente por causa das dependências instaladas localmente (**629 MiB**) e dos artefatos/cache do Next.js (**369 MiB**). Juntos, esses diretórios ocupam cerca de **998 MiB** e são os candidatos mais claros para limpeza local e reconstrução posterior. Os cerca de **70 MiB** em `docs/` são conteúdo versionado e não podem ser classificados como removíveis sem revisar o material e confirmar sua função. O histórico Git e o diretório Playwright também não devem ser apagados em bloco.

## Grau de certeza

**Alto** quanto à distribuição do espaço e ao caráter local/reconstruível de `node_modules/` e `.next/`, conforme medições, `.gitignore` e `package.json`. **Baixo** quanto à possibilidade de remover o material grande em `docs/`, cuja necessidade funcional não foi investigada.

## Pontos ainda não comprovados

- Se algum servidor ou processo está usando `node_modules/` ou `.next/` agora.
- Se os arquivos grandes em `docs/Painel de NA no Brasil (Copy)/ppt/` têm uma fonte original equivalente ou são necessários ao projeto.
- Se o usuário quer efetivamente executar uma limpeza local; nenhuma remoção foi feita.
