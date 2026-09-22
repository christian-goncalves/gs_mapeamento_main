# Diagnóstico do bloqueio de navegação do responsável em Unidade & Propósito Roraima

## Objeto da investigação

Determinar por que o responsável do grupo “Unidade & Propósito Roraima” não consegue permanecer nas telas “Responsável” e “Relatórios” e retorna continuamente para “Configurações”, comparando o comportamento com o grupo USL e com o acesso administrativo.

## Contexto

A investigação foi realizada em 22/09/2026, no checkout local do GS Mapeamento (`http://localhost:3000`), usando as abas já abertas no Chrome: a tela de configurações de Roraima, a área do responsável e a planilha `GS Mapeamento | DEV`.

O escopo foi somente leitura. Não houve alteração de código, configuração ou célula da planilha.

## Evidências examinadas

- Capturas fornecidas no pedido: a tela de configurações de “Unidade & Propósito Roraima” mostra no menu os itens “Responsável”, “Relatórios” e “Configurações”; a tela do grupo USL mostra a área do responsável.
- Aba local autenticada de Roraima, inicialmente em `/grupos/505ba5ab-850a-42a1-bf26-612ea4869dc0?status=servidores-mesa-required`, inspecionada com Playwright.
- DOM autenticado de Roraima: os links presentes são `Responsável` → `/responsavel/atas`, `Relatórios` → `/responsavel/relatorios` e `Configurações` → `/grupos/505ba5ab-850a-42a1-bf26-612ea4869dc0`.
- Inspeção Playwright do link `Responsável` em Roraima: `href` correto, `pointer-events: auto`, link visível, sem elemento sobreposto no ponto de clique e sem erros ou avisos de console.
- Reprodução Playwright em Roraima: o clique em `Responsável` terminou novamente na URL de Configurações; a navegação direta para `/responsavel/atas` também terminou em `/grupos/505ba5ab-850a-42a1-bf26-612ea4869dc0?status=servidores-mesa-required`.
- Reprodução Playwright em Roraima: a navegação direta para `/responsavel/relatorios` terminou na mesma URL de Configurações com `status=servidores-mesa-required`. O DOM final continuou mostrando o grupo Roraima e não apresentou erro de console.
- Planilha [GS Mapeamento | DEV](https://docs.google.com/spreadsheets/d/1oHQ_VgwlRHEEUZP5gXyUX8RiGz0hEEZebHUhXiy1imU/edit?gid=2061970308#gid=2061970308), aba `grupo_servidores_mesa`, lida pelo intervalo `A1:I20`:

  | Grupo | Encargo | Nome | Ativo |
  |---|---|---|---|
  | `505ba5ab-850a-42a1-bf26-612ea4869dc0` (Roraima) | Tesoureiro | Christian | TRUE |
  | `8806319f-dd2d-4b67-9416-ab42bb991870` (USL) | RSG | Carlão | TRUE |
  | `8806319f-dd2d-4b67-9416-ab42bb991870` (USL) | RSG suplente | Esselin | TRUE |
  | `8806319f-dd2d-4b67-9416-ab42bb991870` (USL) | Secretário | vago | TRUE |
  | `8806319f-dd2d-4b67-9416-ab42bb991870` (USL) | Tesoureiro | vago | TRUE |

- Planilha, aba `usuarios_grupo`: existe uma associação ativa entre o grupo Roraima (`505ba5ab-850a-42a1-bf26-612ea4869dc0`) e um usuário de grupo.
- Planilha, aba `grupos`: Roraima está ativo e tem o mesmo identificador usado na URL e na navegação observada.
- `src/app/navigation-config.ts:31-46`: define os destinos dos três itens do menu responsável.
- `src/app/responsavel/responsavel-shell.tsx:43-58`: renderiza os destinos como links normais do Next.js.
- `src/app/app-shell.tsx:106-122`: o clique no menu apenas fecha o menu responsivo; não cancela o comportamento padrão dos links.
- `src/app/responsavel/atas/page.tsx:34-40`: a rota Responsável chama `redirectIfResponsibleMesaServersIncomplete` antes de renderizar a tela.
- `src/app/responsavel/relatorios/page.tsx:55-64`: a rota Relatórios chama o mesmo guard antes de renderizar o dashboard.
- `src/lib/auth/require-mesa-servers.ts:9-20`: para `responsavel_grupo`, procura um grupo sem os encargos exigidos e redireciona para Configurações com `status=servidores-mesa-required`.
- `src/domain/grupo-servidores-mesa.ts:3-8,21-42`: define os quatro encargos padrão e a função `hasRequiredMesaServers`.
- `src/app/grupos/[grupoId]/page.tsx:18-42`: recebe o redirecionamento e renderiza a tela de configurações do grupo.
- `src/app/grupos/group-editor.tsx:73-111` e `src/app/grupos/mesa-servers-summary.tsx:36-69`: sintetizam os encargos padrão ausentes como “Vago” na tela, mesmo quando não há uma linha persistida correspondente na planilha.
- `src/app/grupos/group-editor.tsx:502-505`: a mensagem informativa exibida no editor trata `saved-mesa-missing-names`, mas não o status `servidores-mesa-required` observado no redirecionamento.

## Estado observado

- Os links do menu de Roraima possuem destinos diferentes e tecnicamente corretos.
- O clique não é bloqueado por invisibilidade, `pointer-events`, sobreposição visual ou erro de console.
- Ao tentar acessar `/responsavel/atas` e `/responsavel/relatorios` no contexto autenticado de Roraima, a aplicação termina em `/grupos/505ba5ab-850a-42a1-bf26-612ea4869dc0?status=servidores-mesa-required`.
- A tela final permanece em Configurações e exibe quatro encargos: RSG, RSG suplente e Secretário como “Vago”, e Tesoureiro como “Christian”.
- Na planilha, para Roraima só há uma linha ativa de `grupo_servidores_mesa`: Tesoureiro. Não há linhas ativas para RSG, RSG suplente ou Secretário.
- Na planilha, USL possui linhas ativas para os quatro encargos padrão, ainda que dois nomes estejam como “vago”.
- O guard retorna imediatamente quando o papel é `administrador`, portanto a regra não bloqueia o painel administrativo.

## Análise

O menu está funcionando como navegação. `responsavelNavigationItems` entrega os `href` corretos, `ResponsavelShell` usa `Link` do Next.js e o manipulador de `AppShell` somente executa `setOpen(false)`. A reprodução Playwright também encontrou o link visível e sem obstrução. Portanto, o fato de a tela continuar em Configurações não é causado pelo destino errado do menu nem por um bloqueio visual do clique.

As duas rotas que o usuário tenta acessar fazem uma verificação adicional antes de renderizar o conteúdo. `redirectIfResponsibleMesaServersIncomplete` só ignora essa verificação quando o papel não é `responsavel_grupo`; para um responsável, ela percorre os grupos acessíveis e chama `hasRequiredMesaServers`. Se encontrar um grupo incompleto, executa exatamente o redirecionamento observado, acrescentando `status=servidores-mesa-required`.

Os quatro encargos exigidos são RSG, RSG suplente, Secretário e Tesoureiro. Roraima tem somente Tesoureiro persistido como ativo na aba `grupo_servidores_mesa`. Como faltam três encargos exigidos, `hasRequiredMesaServers` retorna falso para esse grupo. Isso explica tanto a navegação direta quanto o clique que aparentemente “não faz nada”: o clique inicia a rota, a rota aplica o guard no servidor e a resposta retorna para Configurações.

USL não apresenta o mesmo comportamento porque tem registros ativos para os quatro encargos. A função atual verifica a existência de um registro ativo para cada encargo; o texto “vago” não torna o registro falso nessa função, porque `normalizeMesaName` devolve uma string não vazia. Assim, USL passa esse guard mesmo com nomes ainda vagos.

O painel de Configurações mascara parcialmente a diferença entre a interface e a persistência: seus componentes criam visualmente linhas padrão ausentes e as mostram como “Vago”. Portanto, ver RSG, RSG suplente e Secretário na tabela da tela não prova que essas três linhas existam na planilha. A planilha é a evidência da ausência que dispara o guard.

Há também uma lacuna de diagnóstico na interface: o redirecionamento usa `status=servidores-mesa-required`, mas o editor não converte esse status na mensagem informativa que explica a exigência. Por isso, o usuário é levado de volta para Configurações sem uma explicação visível no estado observado.

## Hipóteses avaliadas

### Destino incorreto no menu

Descartada. O DOM e `src/app/navigation-config.ts:31-46` mostram os destinos corretos.

### Menu responsivo ou CSS bloqueando o clique

Descartada para a sessão examinada. O link estava visível, com `pointer-events: auto`, sem sobreposição no ponto de clique e sem erro de console.

### Erro JavaScript ou falha geral de carregamento

Enfraquecida e não sustentada pela reprodução. As duas tentativas terminaram em uma tela válida de Configurações, com o parâmetro de status específico e sem erros ou avisos de console.

### Encargos da mesa ausentes na base de Roraima

Confirmada. A planilha contém apenas Tesoureiro ativo para Roraima, enquanto o código exige os quatro encargos padrão antes de renderizar as duas telas do responsável.

### Regra específica para administradores

Compatível com o relato. O guard retorna sem verificar a mesa quando `access.role` não é `responsavel_grupo`; por isso, o administrador não sofre esse redirecionamento.

## Diagnóstico

O grupo “Unidade & Propósito Roraima” fica permanentemente em Configurações porque as rotas `/responsavel/atas` e `/responsavel/relatorios` estão protegidas por uma regra de integridade dos servidores da mesa. Na base DEV, Roraima possui somente o encargo Tesoureiro ativo; faltam os registros ativos de RSG, RSG suplente e Secretário. O guard detecta essa ausência e redireciona as duas rotas para `/grupos/505ba5ab-850a-42a1-bf26-612ea4869dc0?status=servidores-mesa-required`.

Portanto, a causa está confirmada nos dados persistidos combinados com a regra de acesso da aplicação. O menu não está quebrado. USL passa porque possui os quatro registros de encargo; o administrador não é submetido a esse guard. A sensação de “permanecer na configuração” é o resultado visual do redirecionamento, agravado pelo fato de o status específico não gerar uma explicação visível na tela.

## Solução implementada

Conforme a regra de negócio confirmada, a existência de servidores da mesa não controla o acesso do responsável ao painel. A aplicação foi ajustada para:

- remover o redirecionamento por `servidores-mesa-required` das entradas `/responsavel`, `/meu-grupo`, `/responsavel/atas`, `/responsavel/relatorios` e `/atas/nova`;
- permitir que o responsável acesse Responsável, Relatórios e Nova Ata mesmo sem servidores cadastrados;
- permitir o envio de atas sem exigir previamente registros em `grupo_servidores_mesa`;
- manter a representação visual dos encargos ausentes como “Vago”, sem criar registros artificiais na planilha;
- preservar a autenticação e a autorização do responsável pelos grupos associados;
- remover o helper de bloqueio que deixou de ter uso e adicionar teste específico para envio sem servidores da mesa.

Não houve alteração na planilha nem envio real de ata. A validação com Playwright confirmou, para Roraima, o acesso direto e pelo menu às telas Responsável e Relatórios, além da abertura de Nova Ata, sem o parâmetro `servidores-mesa-required`.

## Grau de certeza

Alto. A causa foi reproduzida com Playwright na sessão aberta, o destino final contém o status exato emitido pelo guard, o código mostra a condição e o redirecionamento, e a planilha confirma quais registros de Roraima estão ausentes.

## Pontos ainda não comprovados

- Não foi inspecionado o aparelho físico da colaboradora; contudo, a mesma condição foi reproduzida na sessão local autenticada aberta no Chrome.
- Não foi feita uma nova sessão administrativa para clicar no menu; a ausência do bloqueio administrativo é demonstrada pelo retorno antecipado do guard para papéis diferentes de `responsavel_grupo`.
- A aba do responsável que inicialmente mostrava USL estava com conteúdo previamente carregado; ao navegar novamente sob o estado autenticado corrente, a aplicação reavaliou a sessão e terminou em Roraima. Isso não altera a causa confirmada do redirecionamento de Roraima.
