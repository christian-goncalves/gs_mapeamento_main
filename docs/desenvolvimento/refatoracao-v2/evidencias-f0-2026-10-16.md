# Evidências de preparação da F0 — 16/10/2026

## Escopo desta conferência

F0 iniciada por instrução do usuário. Foram feitas leituras de código, documentação, metadados e cabeçalhos do Google Sheets DEV, além do baseline local. Não houve escrita em planilhas, reconciliação, criação de backup, provisionamento, alteração de código de aplicação ou publicação.

## F00-T01 — Base, branch e worktree

- Repositório: `/home/cg/Documentos/01-DEV/PROJETOS/gs-mapeamento`.
- Branch: `main`; HEAD: `06d74dafd6625769607d575211a69ea203bcf73e` (`06d74da`).
- O deploy de produção atual consultado na Vercel está no mesmo commit.
- Um worktree registrado: o checkout acima.
- Antes de iniciar esta execução, `git status --porcelain=v1 --untracked-files=all` tinha 99 entradas. Incluía alteração em `docs/README.md`, exclusões em `docs/REFATORACAO-1_MARCOS`, `docs/analise-diagnostico` e conteúdo V2 não rastreado. Tudo foi preservado; nada foi descartado, commitado ou staged.
- A referência absoluta em `AGENTS.md` aponta para outro checkout e não existe neste sistema. Foram seguidas as diretrizes locais em `docs/desenvolvimento/diretrizes-agentes.md`, além de `README.md`, `docs/README.md` e documentos V2 vinculados.
- O build isolado foi executado a partir de `git archive HEAD` em `/tmp/gs-mapeamento-f0-20261016`, sem `.env.local`. O primeiro ensaio com `node_modules` por symlink foi recusado pelo Turbopack; a cópia local das dependências no diretório temporário permitiu rodar o baseline integralmente.

## F00-T02 — Ambientes e papéis

### Desenvolvimento local

- `.env.local` contém `GOOGLE_SHEETS_ID`; `GOOGLE_SHEETS_DEV_ID` e `GOOGLE_SHEETS_TEST_ID` estão ausentes. O valor do ID não foi exibido.
- Com escopo OAuth somente de leitura, os metadados da planilha selecionada por `GOOGLE_SHEETS_ID` retornaram o título `GS Mapeamento | DEV`. Foram consultados apenas metadados, cabeçalhos e dados necessários para contagens/validação; nenhum valor de negócio foi registrado aqui.
- A aplicação foi iniciada em `http://127.0.0.1:3000`, usando `.env.local`. Uma requisição sem sessão a `/responsavel/atas` redirecionou para `/login` (HTTP 307). A aba local já aberta do usuário em `/responsavel/atas` carregou com HTTP 200; isso comprova acesso à rota de responsável, sem inspecionar ou registrar linhas da planilha.
- A instância de desenvolvimento foi iniciada nesta execução e permanece ativa. A sessão administrativa autenticada foi posteriormente confirmada no Chrome, na rota `/admin/grupos`.

### Vercel

- Projeto `gs-mapeamento`, framework Next.js. O deploy atual consultado está `READY`, alvo `production`, commit `06d74da`.
- O deploy mais recente com alvo `preview` também está `READY`, mas aponta para o commit `a27a9722c14b4f5af3d8f9c2eba9e15693e8c424` e branch `codex/public-safe-diagnostics-20261014`.
- A listagem também contém deployments de produção anteriores `READY`, um no commit `ecaca0137f34c12c5a29a384de7405b5520609b9` e outro sem SHA de commit nos metadados. Eles não são o alvo de produção mais recente. Sua possibilidade de escrita e política de expiração/corte precisam ser tratadas no inventário de F1.
- A listagem de variáveis foi feita com `decrypt=false`: `GOOGLE_SHEETS_ID` está configurada para `production`; não há configuração dessa variável para `preview`. Os valores não foram revelados. Portanto, a identidade/título da planilha usada pelo runtime de produção não foi confirmada por leitura direta; o preview não tem evidência de acesso ao Sheets.
- Proteção SSO está habilitada nas URLs de deployment, com a exceção de domínios customizados, conforme metadados do projeto. Isso não prova quais papéis da aplicação conseguem entrar.

### Pendência de acesso por papel

Para fechar F00-T02 falta confirmar a identidade/título da planilha usada pelo runtime de produção e o escopo de grupo do responsável autenticado. A rota local de responsável respondeu 200, mas não foi preciso ler o nome do grupo nem as atas. O acesso administrativo em DEV foi confirmado separadamente no Chrome.

## F00-T03 — Baseline isolado

Executado no espelho temporário do commit acima, sem `.env.local` e sem acesso configurado ao Sheets:

| Comando | Resultado |
| --- | --- |
| `npm test` | 44 arquivos e 284 testes passaram; exit code 0. |
| `npm run lint` | Passou; exit code 0. |
| `npm run build` | Passou com Turbopack; TypeScript e geração de páginas concluídos; exit code 0. |

O `.next` preexistente do checkout principal foi preservado. O servidor de desenvolvimento alterou a referência gerada em `next-env.d.ts` para `.next/dev/types/routes.d.ts`; essa alteração incidental foi revertida, e o arquivo voltou ao estado do início da execução. O alerta de depreciação de `zlib.bytesRead` apareceu no log do servidor, sem impedir o acesso local.

## F00-T04 — Contrato físico e legado observado em DEV

### Estado físico e leitores atuais

- As onze abas esperadas pelo código estão presentes, com os cabeçalhos da linha 1 exatamente na ordem de `src/lib/sheets/contract.ts`. Os cabeçalhos de `visitantes` são compatíveis com aliases históricos `categoria`, `origem_contato` e `como_chegou_a_na?` no leitor.
- A linha de cabeçalho de `usuarios_grupo` foi lida; os registros não foram consultados, pois essa aba guarda dados de acesso e não é necessária para validar os contratos de negócio V2.
- O repositório exige correspondência exata de quantidade e ordem em `rowsToObjects`; a única tolerância atual é até três cabeçalhos finais ausentes em `grupos`.
- O leitor agregado usa `A:Z`. A API reportou grades com mais colunas físicas em algumas abas; isso não demonstra que existam campos de contrato após Z, mas confirma que não se pode deduzir o alcance útil apenas da largura da grade.
- Existe uma aba adicional chamada `Página7`, fora do contrato da aplicação. A primeira linha não corresponde a cabeçalho contratual. Seu conteúdo não foi registrado nem alterado. A origem e a política para preservá-la precisam ser confirmadas antes de qualquer migração ou reconciliação.

### Validação das linhas existentes

Leitura somente da planilha DEV; os dados foram mantidos em memória e apenas totais de validação foram impressos. Cada linha abaixo passou pelo schema de linha atual do repositório:

| Aba contratual | Linhas | Válidas | Inválidas |
| --- | ---: | ---: | ---: |
| `grupos` | 3 | 3 | 0 |
| `grupo_horarios` | 29 | 29 | 0 |
| `grupo_servidores_mesa` | 8 | 8 | 0 |
| `atas` | 112 | 112 | 0 |
| `servidores` | 352 | 352 | 0 |
| `participacao` | 2.900 | 2.900 | 0 |
| `visitantes` | 257 | 257 | 0 |
| `ingressos` | 45 | 45 | 0 |
| `trocas_chaveiro` | 93 | 93 | 0 |

Esse resultado valida formato e enums dos schemas atuais; não prova, sozinho, vínculos entre abas, semântica de cada exceção histórica ou identidade das planilhas de produção.

### Proposta de representação física V2

Proposta aceita pelo usuário como direção de compatibilidade para F1; isso não autoriza migração nem escrita. A posição dos campos novos deve ser derivada de `SHEET_HEADERS`, não codificada por número de coluna. O leitor futuro terá de cobrir colunas além de Z e coexistir com a versão antiga durante a publicação compatível.

| Entidade | Campo físico proposto | Regra inicial de compatibilidade |
| --- | --- | --- |
| `atas` | `status_registro` (`ativa`, `substituida`, `excluida`) | Campo ausente em legado equivale a `ativa`. |
| `atas` | `status_aprovacao` (`aprovada`, `pendente_revisao`) | Campo ausente em legado equivale a aprovada/`Enviada`; a configuração do grupo afeta somente novos envios. |
| `atas` | `revisao_de_ata_id`, `motivo_alteracao`, `alterado_por`, `alterado_em`, `excluida_em` | UUID e relações antigos permanecem intactos; motivo/autor/data são obrigatórios na revisão ou exclusão aplicável. |
| `atas` | `aprovado_por`, `aprovado_em` | Metadados de auditoria a validar contra o contrato canônico antes de F1. |
| `grupo_plataformas` | `plataforma_id`, `grupo_id`, `nome`, `tipo`, `link_padrao`, `ativo`, `created_at`, `updated_at` | Catálogo pertence ao grupo; preserva identificadores de atas. |
| `grupo_horarios` | `plataforma_id`, `vigente_desde`, `vigente_ate` | Horário legado sem vigência não gera falta retroativa. `link_reuniao` permanece como exceção local. |
| `ingressos` | `visitante_id` opcional | Obrigatório para novos ingressos derivados; vazio em legado, sem associação por ordem/cidade. |
| `operacoes` | `operacao_id`, `hash_solicitacao`, `tipo`, `ator`, `estado`, `criada_em`, `concluida_em`, `resultado_ref` | Registro de idempotência separado; deve coexistir no mesmo `batchUpdate` da mutação de negócio que conclui a operação. Estado incerto bloqueia repetição automática. |

Os campos de plataforma atual em `grupos` e o texto `link_reuniao` em `grupo_horarios` não serão apagados durante a compatibilidade. A estratégia de povoamento do novo catálogo depende da leitura autorizada e da revisão das exceções reais em DEV; não assumir que cadastro atual descreve o passado.

## F00-T05 — Escritores, coordenação e limite do lote

### Escritores localizados no código do commit atual

| Escritor | Evidência local |
| --- | --- |
| Envio público/responsável de ata | `src/lib/sheets/create-ata.ts` |
| Administração de grupos, horários e cadastros associados | `src/lib/sheets/group-admin.ts` |
| Usuários e acesso do grupo | `src/lib/sheets/group-users.ts` |
| Atualização administrativa de ata | `src/lib/sheets/ata-admin.ts` |
| Reconciliação de cabeçalhos/validações | `scripts/reconcile-sheet-contract.ts`, `src/lib/sheets/contract-reconciliation.ts` |
| Proteções de abas | `scripts/reconcile-sheet-protections.ts`, `src/lib/sheets/reconcile-protections.ts` |
| Simulação de atas | `scripts/simulate-atas-month.ts` e `src/lib/sheets/create-simulated-atas.ts` |
| Reset administrativo de registros | `scripts/reset-ata-record-sheets.ts` e `src/lib/sheets/reset-ata-records.ts` |

Todos os fluxos que escrevem precisam migrar para o mesmo protocolo. A reconciliação, reset e simulação são operações administrativas distintas e devem continuar desabilitadas no fluxo de produção normal. Edições manuais no Sheets e deployments antigos são escritores externos ao protocolo até o corte ser confirmado.

### Recomendação para o CP-00

**Recomendação:** um único gateway de escrita em Google Apps Script, protegendo a seção crítica com `LockService.getScriptLock()`. O gateway recebe operações autenticadas do backend Vercel, relê estado e autorização dentro do lock, valida versão/conjunto, e usa uma única chamada `spreadsheets.batchUpdate` para dados e log da operação. Um `operacao_id` estável e um ledger na planilha permitem reconhecer reenvio já concluído. Estado pendente/indeterminado falha fechado e exige reconciliação antes de nova tentativa.

Razões: um mutex em memória Vercel não coordena instâncias; uma releitura seguida de escrita também não é comparação-e-troca. O lock Apps Script é global às execuções do mesmo script, mas só coordena os escritores que chamam esse gateway. `batchUpdate` aplica as suboperações juntas atomicamente; isso não impede uma edição manual concorrente nem garante que o Sheets não tenha mudado depois da chamada.

**Custo e operação:** a proposta não adiciona banco ou serviço Cloud com cobrança por instância; consome execução e cotas da conta que possui/deploya o Apps Script. A documentação atual informa 6 minutos por execução, 30 execuções simultâneas por usuário e 1.000 por script; o lock serializa efetivamente as mutações. Cotas podem mudar e dependem do tipo de conta. A conta/licença, quotas disponíveis, responsável operacional e latência aceitável ainda não foram confirmados. Não houve criação nem deployment de script.

**Limite proposto para aprovação:** máximo de 50 atas selecionadas e payload serializado do `batchUpdate` de até 1,5 MiB, prevalecendo o limite alcançado primeiro. Uma única chamada; acima disso, rejeitar antes de gravar e pedir seleção menor, sem dividir silenciosamente. O Sheets não define um tamanho máximo rígido, mas recomenda até 2 MB e pode retornar timeout após 180 segundos. O limite de 1,5 MiB deixa margem para o envelope e deve ser confirmado por medição com casos sintéticos no F1.

### Matriz de concorrência e recuperação

| Cenário | Resposta exigida |
| --- | --- |
| Dois envios simultâneos tentam alocar índices/linhas | Um entra no lock; o segundo relê após a primeira operação e revalida chave, sequência e linha. |
| Reenvio com `operacao_id` concluído | Retornar o resultado já registrado; não aplicar nova mutação. |
| Timeout antes de enviar o lote | Registrar resultado desconhecido no cliente; consultar o ledger pelo mesmo ID, sem gerar novo ID. |
| Timeout após o Sheets poder ter aplicado o lote | Consultar o ledger; se ainda indeterminado, bloquear e encaminhar para reconciliação. Nunca repetir cegamente. |
| Qualquer item de lote mudou, foi excluído ou perdeu autorização | Cancelar o lote inteiro antes da chamada de escrita. |
| Lote excede 50 atas ou 1,5 MiB | Rejeitar integralmente; nunca fatiar em chamadas com sucesso parcial. |
| Lock indisponível, serviço/API indisponível ou quota excedida | Falhar fechado; não usar escrita direta como fallback. |
| Edição manual, script antigo ou deployment fora do gateway | Não há garantia do lock; bloquear no corte operacional ou aceitar explicitamente como risco fora da garantia. |

## F00-T06 — Ponto de retorno e recuperação

Procedimento proposto para aprovação; não executado:

1. Definir janela e responsáveis; suspender todos os escritores conhecidos e registrar o instante/cursor de corte.
2. Criar cópia nativa da planilha inteira em Drive, com nome contendo ambiente, data/hora UTC e commit, preservando abas, cabeçalhos, fórmulas, validações e proteções. Exportar também um arquivo para leitura independente.
3. Conferir cópia e original por títulos/ordem de abas, cabeçalhos, contagem de registros por UUID e hash canônico dos valores relevantes; registrar os totais, sem publicar conteúdo pessoal.
4. Registrar no diário de mudança o ID da cópia, revisão/horário, commit, ambiente, totais e operador. A cópia é o ponto de retorno; não restaura automaticamente a aplicação para leitores antigos incompatíveis.
5. Em recuperação, pausar escritores, importar a cópia em planilha DEV separada e validar. Comparar com o estado atual por UUID e `operacao_id`; preservar qualquer registro válido criado depois do backup. Restaurar apenas linhas/valores comprovadamente afetados, com autorização e revisão do proprietário.
6. Reabrir escrita somente após conferir estado e ledger; registrar o resultado e as operações recuperadas.

Para reconstrução de uma operação indeterminada, procurar o `operacao_id` na linha/ledger escrita atomicamente. Ausência não é prova suficiente enquanto a execução/solicitação anterior ainda puder estar em andamento; aguardar encerramento comprovado e fazer leitura comparativa antes de liberar repetição.

## Fontes técnicas de coordenação

- [LockService — `getScriptLock`](https://developers.google.com/apps-script/reference/lock/lock-service): lock global às execuções do mesmo script.
- [Web Apps do Apps Script](https://developers.google.com/apps-script/guides/web): modo de execução do web app e implantação.
- [Cotas do Apps Script](https://developers.google.com/apps-script/guides/services/quotas): limites atuais por execução/conta, sujeitos a mudança.
- [Sheets `spreadsheets.batchUpdate`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/batchUpdate): suboperações validadas e aplicadas juntas.
- [Limites da API Sheets](https://developers.google.com/workspace/sheets/api/limits): 2 MB recomendado, quotas por minuto e timeout de processamento de 180 segundos.

## Decisões para a conferência CP-00

1. Aceitar a representação física proposta ou ajustar campos/nomes e auditoria antes da F1.
2. Aceitar Apps Script como gateway único de escrita, com fail-closed, operação idempotente e corte de escritores antigos/manuais; ou solicitar outra arquitetura.
3. Aceitar 50 atas e 1,5 MiB como limites iniciais, sujeitos à medição sintética no F1.
4. Confirmar responsável/conta operacional do Apps Script e política de edição manual no corte.
5. Confirmar se `Página7` deve ser preservada sem uso, investigada separadamente ou incluída em outro escopo. Ela não foi alterada.
6. Confirmar uma sessão de administrador e uma de responsável em DEV para fechar o acesso por papel. A instância local está disponível em `http://127.0.0.1:3000`.

### Retorno do usuário — 16/10/2026

O usuário confirmou as decisões/recomendações apresentadas: representação física proposta como direção de F1; preservar `Página7` fora do escopo; gateway único Apps Script com lock/idempotência/falha fechada; teto inicial de 50 atas ou 1,5 MiB; e controle dos escritores manuais/antigos durante o corte. O teto continua sujeito a medição sintética antes de qualquer uso real. Não houve autorização para escrita/migração em Sheets, provisionamento ou publicação.

### Verificação de acesso administrativo DEV — 16/10/2026

Após o usuário informar que a sessão estava autenticada no Chrome, foi inspecionada em modo somente leitura a aba `http://localhost:3000/admin/grupos`. A página exibiu a navegação administrativa, a listagem de grupos e seus controles administrativos, confirmando acesso autenticado à área admin do runtime local DEV. Nenhum controle foi acionado e nenhum dado foi alterado.

Permanecem pendentes a identidade da planilha associada ao runtime PROD e o escopo de grupo da sessão de responsável em DEV. A indicação da conta/responsável operacional do Apps Script também continua pendente.
