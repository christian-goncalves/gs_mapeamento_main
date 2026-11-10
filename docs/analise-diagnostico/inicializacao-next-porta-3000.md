# Diagnóstico da inicialização do Next.js e da porta 3000

## Objeto da investigação

Identificar por que uma nova execução de `npm run dev` falha e verificar se a porta 3000 está ocupada.

## Contexto

O projeto configura `npm run dev` para iniciar Next.js em `127.0.0.1:3000`. O usuário anexou a saída de duas execuções: uma que iniciou e atendeu páginas e outra que falhou ao tentar iniciar novamente.

## Evidências examinadas

- Texto colado em `/home/cg/.codex/attachments/eb39ef62-369b-448f-b246-2e930e97ff2a/Texto colado.txt`.
- `package.json`: script `dev` executa `next dev --webpack --hostname 127.0.0.1 --port 3000`.
- `src/app/grupos/actions.ts:621-638`: a ação de salvar horários chama `saveGrupoHorarioSet`.
- `src/lib/sheets/group-admin.ts:470-497`: a função consulta os cabeçalhos da planilha e lança erro se recebe `hora_termino` sem essa coluna.
- `src/lib/sheets/contract.ts:12-15`: os cabeçalhos padrão definidos para `grupo_horarios` não incluem `hora_termino`.
- Playwright em `http://127.0.0.1:3000/`: recebeu redirecionamento `307` para `/responsavel/atas`, que respondeu `200`; os arquivos JS e CSS solicitados responderam `200`.
- Console capturado pelo Playwright na primeira navegação: `Switched to client rendering because the server rendering errored: Cannot read properties of undefined (reading 'call')`, com pilha em `.next/dev/server/webpack-runtime.js:25` e no runtime App Router do Next.
- `.next/dev/logs/next-development.log`: registra `TypeError: Cannot read properties of undefined (reading 'call')` no processo Node `134922` durante a primeira compilação observada.
- Segunda navegação direta pelo Playwright para `/responsavel/atas`: não gerou novas mensagens de erro no console; após a renderização, a página mostrou os filtros, as linhas da tabela e a paginação.
- Verificações locais da porta: `ss` mostrou `127.0.0.1:3000` em `LISTEN`; uma tentativa inicial de `curl` com limite de 2 segundos expirou, mas chamadas posteriores pelo Playwright receberam resposta e `curl` recebeu `307`. O PID/nome proprietário do listener não ficou visível pelas ferramentas disponíveis neste namespace.
- `AGENTS.md` e `docs/README.md`: apontam documentação adicional em `/home/cg/Documentos/01-DEV/PROJETOS/Apps/02-GS_Mapeamento/docs/`, mas esse diretório não existe neste ambiente.

## Estado observado

- Na primeira execução do log, Next.js anunciou `Ready in 523ms` em `127.0.0.1:3000`.
- Essa execução respondeu com `200` para `/responsavel/atas` e para a página do grupo; portanto, o processo conseguiu iniciar e servir páginas.
- Uma ação `POST` para salvar horários respondeu `500` com a mensagem `A coluna hora_termino ainda não existe em grupo_horarios.`
- Em seguida, o terminal registra `^Z` e `[1]+ Parado npm run dev`.
- A nova execução de `npm run dev` falhou com `EADDRINUSE` em `127.0.0.1:3000`.
- A primeira navegação com Playwright acionou o erro de renderização informado pelo usuário. A página respondeu `200` e a navegação mudou para renderização no cliente.
- O primeiro snapshot mostrou `Carregando tabela...`; ao navegar novamente e aguardar a hidratação, o conteúdo e as linhas da tabela apareceram sem novos erros no console.
- A porta 3000 foi observada em `LISTEN` durante a investigação e respondeu às requisições posteriores.

## Análise

O primeiro processo não falhou ao iniciar: o log registra prontidão e respostas HTTP. O erro `500` ocorreu depois, durante a ação de salvar horários, e aponta para incompatibilidade entre o campo enviado pela interface (`hora_termino`) e os cabeçalhos presentes na aba `grupo_horarios` do Google Sheets. Esse erro de aplicação não explica a falha de bind da execução seguinte.

`Ctrl+Z` suspende o trabalho em primeiro plano no terminal, em vez de encerrá-lo. A evidência `[1]+ Parado` confirma a suspensão no shell mostrado. Como a tentativa seguinte retorna `EADDRINUSE` para o mesmo endereço e porta, a explicação sustentada é que o processo suspenso permaneceu com o socket da porta 3000 aberto. A primeira tentativa local de HTTP expirou em 2 segundos; chamadas posteriores responderam, incluindo a navegação pelo Playwright. O PID proprietário não ficou visível para correlacioná-lo ao PID `129440` mencionado no log anexado.

O erro novo ocorre dentro do runtime Webpack do Next ao tentar executar uma entrada de módulo indefinida (`__webpack_modules__[moduleId].call` em `.next/dev/server/webpack-runtime.js:25`). O HTML inicial e os recursos estáticos foram entregues, mas o Next reportou falha no render do servidor e acionou o fallback de renderização no cliente. O Playwright viu isso na primeira navegação; uma navegação seguinte não trouxe novos erros e terminou com a tabela renderizada. O registro local confirma o TypeError, mas não informa o ID do módulo ausente nem a origem do estado inconsistente.

## Hipóteses avaliadas

- **Processo anterior suspenso ainda mantém a porta aberta — sustentada.** O terminal mostra `Ctrl+Z`, o trabalho marcado como parado e, logo depois, `EADDRINUSE`; a porta está atualmente em `LISTEN`.
- **A coluna ausente em `grupo_horarios` impede a inicialização — descartada como causa da porta ocupada.** O erro aparece em uma ação posterior, quando o servidor já estava pronto, e resulta em `POST 500`.
- **Aviso de depreciação do Node.js impede a inicialização — descartada pelo log.** O aviso aparece após `Ready` e as páginas continuam respondendo.
- **Falha de resolução/registro de módulo do runtime Webpack — confirmada como mecanismo imediato do erro de renderização.** O stack trace aponta para a chamada de `.call` de uma entrada indefinida em `webpack-runtime.js`.
- **Artefatos ou grafo de módulos de desenvolvimento inconsistentes — hipótese possível, origem não confirmada.** A falha ocorreu na primeira navegação durante compilação inicial e não se repetiu na navegação seguinte, mas não há no log o módulo envolvido nem prova de qual estado causou a inconsistência.

## Diagnóstico

A falha da segunda inicialização é causada pela porta `127.0.0.1:3000` já estar ocupada. No fluxo registrado, a causa mais provável e diretamente apoiada é o servidor anterior ter sido suspenso com `Ctrl+Z`, sem liberar a porta. A porta também foi observada em `LISTEN` durante esta análise, mas o processo proprietário não pôde ser identificado neste namespace.

Há ainda um problema independente na gravação de horários: a aplicação envia `hora_termino`, mas a aba `grupo_horarios` lida pela execução não possui esse cabeçalho, e o servidor retorna `500` nessa ação.

O erro de renderização informado também foi observado pelo Playwright na primeira navegação de desenvolvimento. O gatilho imediato é uma referência de módulo ausente no runtime Webpack durante SSR. A falha foi recuperável: a rota respondeu e uma navegação seguinte renderizou a tabela. A causa raiz do módulo indefinido permanece inconclusiva com as evidências disponíveis.

## Grau de certeza

Alto para a causa do `EADDRINUSE` no trecho anexado: o próprio terminal registra a suspensão do processo antes da nova tentativa e o conflito subsequente. Alto para confirmar o mecanismo imediato do erro Webpack, pois o console e o log local apontam para o runtime e a chamada que falhou. Baixo para sua causa raiz, porque o ID do módulo ausente não foi registrado e a falha não se repetiu na navegação subsequente.

## Pontos ainda não comprovados

- A identidade do processo que mantém `127.0.0.1:3000` em `LISTEN`; o PID proprietário não ficou visível neste namespace.
- Se a aba real `grupo_horarios` continua sem `hora_termino` neste momento; o log confirma a ausência na execução que falhou, enquanto a inspeção desta análise foi limitada ao código local.
- Qual módulo Webpack estava indefinido e por que o registro do servidor estava ausente na primeira renderização.
