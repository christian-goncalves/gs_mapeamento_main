# Fundo bege após entrar em `/responsavel/atas`

## Objeto da investigação

Investigar o fundo bege e a aparente borda inferior visíveis após a entrada no sistema, na rota `/responsavel/atas`.

## Contexto

O usuário informou que, ao entrar, a tela deixa o fundo azul do login e passa a mostrar bege na parte inferior, além de uma borda nessa cor. A captura enviada mostra a rota `/responsavel/atas` com o conteúdo principal em azul muito claro e uma faixa bege abaixo do contêiner visual da aplicação.

## Evidências examinadas

- Captura de tela enviada pelo usuário nesta conversa, na URL `http://127.0.0.1:3000/responsavel/atas`.
- Captura de viewport da renderização local da mesma rota via Playwright, inspecionada durante esta investigação; o artefato temporário não foi retido.
- Estilos globais em `src/app/globals.css:1-14`, que definem `--paper: #f7f4ec` e aplicam `background: var(--paper)` ao `body`.
- Estilos do shell em `src/app/globals.css:774-775`, que dão ao `.responsavel-layout` fundo herdado de `--paper` e `min-height: 100vh`.
- Estilos específicos do histórico em `src/app/globals.css:2010-2029`, que substituem o fundo do `.responsavel-layout` por `#fcfdff` e usam superfícies azuladas na navegação.
- Fluxo de autenticação em `src/app/login/actions.ts:7-20`, `src/app/login/page.tsx:41-43` e `src/app/page.tsx:6-9`. O login direciona para `/`, que redireciona o perfil de responsável para `/responsavel/atas`; a página de login também direciona uma sessão já autorizada para essa rota.
- Medições de estilos computados via Playwright em `http://127.0.0.1:3000/responsavel/atas`: viewport inicial de `1050 × 955` CSS px; `body` com fundo `rgb(247, 244, 236)`; `.responsavel-layout` com fundo `rgb(252, 253, 255)` e retângulo de `1050 × 955` px, cobrindo a viewport. Em nova medição, `body` e `.responsavel-layout` tinham `border-bottom-width: 0px`; os quatro lados do contêiner também tinham largura de borda `0px`.

## Estado observado

Na captura do usuário, a aplicação ocupa a área superior e há uma faixa bege visível abaixo dela, além de um contorno externo fino. Na renderização local por Playwright, a área de `/responsavel/atas` aparece azul muito claro até o fim da viewport, sem faixa bege inferior.

No navegador local, o `body` continua bege, enquanto o `.responsavel-layout` cobre a viewport e tem fundo `#fcfdff`. O contêiner e o `body` não apresentam borda inferior computada.

## Análise

O redirecionamento após autenticação não troca a cor global do `body`: o fundo bege é definido como padrão em `:root` e aplicado permanentemente ao `body`. A rota autenticada tem uma regra própria que define o fundo do shell em `#fcfdff`. A medição local mostra que esse shell cobre a viewport, portanto o fundo bege fica encoberto nessa renderização.

A captura enviada e a renderização local não coincidem quanto à faixa inferior. Como o retângulo do shell coincide com a viewport na medição local, a faixa vista na captura pode estar fora da área CSS da página, no contêiner que a exibe, ou depender de uma diferença de viewport/estado que não foi reproduzida. A imagem, por si só, não identifica qual desses elementos está pintando a faixa.

O contorno inferior também não corresponde a uma borda CSS computada no `body` ou no shell inspecionados. O contorno fino visível na captura pode pertencer ao contêiner externo de exibição, mas isso não foi confirmado.

## Hipóteses avaliadas

- **A página `/responsavel/atas` está inteiramente bege:** descartada pela regra local específica e pela medição/renderização do shell em `#fcfdff`.
- **O fundo global bege pode aparecer em áreas sem cobertura do shell:** sustentada pelo CSS global do `body`; não explica, por si só, a diferença entre a captura do usuário e a renderização local, em que o shell ocupa toda a viewport.
- **A faixa é uma borda inferior do `body` ou do `.responsavel-layout`:** não sustentada; ambos apresentam largura de borda inferior computada de `0px`.
- **O contêiner externo da captura exibe o bege e o contorno:** compatível com a diferença entre as duas imagens, mas não confirmado sem inspecionar essa moldura no contexto em que a captura foi feita.

## Diagnóstico

Após entrar, o código direciona o responsável para `/responsavel/atas`. Nessa rota, o fundo do shell é azul muito claro (`#fcfdff`), mas o `body` mantém o bege global (`#f7f4ec`). Na renderização local medida, o shell cobre toda a viewport, e não há borda inferior no `body` nem no shell. Portanto, o bege e o contorno da faixa inferior mostrada pelo usuário não foram reproduzidos dentro da página local; a origem exata dessa faixa permanece inconclusiva.

## Grau de certeza

Alto quanto às cores e à ausência de borda inferior computada na renderização local. Médio quanto à origem visual da faixa da captura, porque ela não aparece na renderização local correspondente.

## Pontos ainda não comprovados

- Se a faixa bege aparece dentro da viewport CSS no navegador do usuário ou pertence à moldura que exibe a página.
- Se há um breve flash bege durante o clique e o redirecionamento; a investigação mediu a rota já carregada, não reproduziu uma nova autenticação.
- Qual elemento desenha o contorno externo fino visível na captura fornecida.
