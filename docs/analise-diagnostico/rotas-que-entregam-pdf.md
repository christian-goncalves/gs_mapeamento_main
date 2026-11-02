# Rotas que entregam PDF na aplicação

## Objeto da investigação

Identificar os PDFs que a aplicação pode entregar e distinguir os endpoints que retornam bytes PDF das páginas HTML e ações de impressão ou envio por e-mail.

## Contexto

A pesquisa foi feita no código atual do GS Mapeamento, sem executar chamadas autenticadas, gerar PDFs, abrir a caixa de impressão ou enviar e-mails.

## Evidências examinadas

- `src/app/api/atas/[ataId]/pdf/route.ts:9-38`: handler GET, verificação de sessão e grupo, geração de bytes e cabeçalhos da resposta.
- `src/app/api/atas/[ataId]/pdf/route.test.ts:25-60`: expectativas de `application/pdf`, abertura inline, download e autorização.
- `src/lib/pdf/ata-pdf-document.tsx:474-475`: função que renderiza o documento PDF em buffer.
- `src/app/atas/[ataId]/pdf/page.tsx:12-63`: página de pré-visualização e iframe que aponta para o endpoint PDF.
- `src/app/api/atas/[ataId]/pdf/email/route.ts:16-56`: handler POST que gera o PDF, envia-o como anexo e devolve JSON.
- `src/app/relatorios/print-dashboard-button.tsx:6-20`: botão de relatório que chama `window.print()`.
- `src/app/admin/relatorios/page.tsx:75-84`, `src/app/responsavel/relatorios/page.tsx:67-79` e `src/app/responsavel/relatorios-azul/page.tsx:44-62`: páginas que usam esse botão de impressão.
- `src/app/globals.css:1249-1270`: regras `@media print` que ajustam as páginas do dashboard para impressão.
- `src/app/admin/atas/admin-atas-table.tsx:213-217`: ação “Gerar PDF” identificada no código como ainda não implementada.
- Inventário de `src/app/**/route.ts`: único handler com cabeçalho `application/pdf` é o endpoint de PDF da ata.
- Capturas fornecidas: `/responsavel/atas` com a ação “Visualizar PDF”; `/responsavel/relatorios?mes=9&ano=2026` e o diálogo do navegador com destino “Salvar como PDF” e prévia de 2 páginas.

## Estado observado

- `GET /api/atas/[ataId]/pdf` retorna os bytes gerados com `Content-Type: application/pdf`. Sem parâmetro, `Content-Disposition` usa `inline`; com `?download=1`, usa `attachment`.
- O primeiro tipo de documento PDF é a ata, renderizada por `renderAtaPdf`.
- O endpoint exige sessão autorizada e acesso ao grupo da ata; se a ata não existir ou não houver acesso, retorna 404 JSON.
- `GET /atas/[ataId]/pdf` é uma página HTML de pré-visualização. Seu iframe carrega `/api/atas/[ataId]/pdf`; o link de baixar usa o mesmo endpoint com `?download=1`.
- `POST /api/atas/[ataId]/pdf/email` gera um PDF para anexar ao e-mail, mas a resposta HTTP é JSON, não PDF.
- O segundo tipo é o relatório mensal. `/admin/relatorios` e `/responsavel/relatorios` usam `PrintDashboardButton`, que chama `window.print()`; a saída PDF é gerada pelo navegador a partir da página HTML e das regras de impressão. Não há endpoint HTTP que retorne os bytes desse PDF mensal.
- `/responsavel/relatorios-azul` também tem impressão, mas é uma demonstração com fixture estática; não é uma terceira categoria de PDF nem substitui o relatório mensal real.
- Há uma ação de PDF na tabela Admin de atas cujo próprio código indica que ainda será implementada.
- Fluxos de PDF no Responsável, conforme o código e as capturas:
  - Ata: `/responsavel/atas` → `/atas/[ataId]/pdf` → `/api/atas/[ataId]/pdf` (visualização); download em `/api/atas/[ataId]/pdf?download=1`.
  - Relatório mensal: `/responsavel/relatorios?mes=9&ano=2026` → impressão do navegador → “Salvar como PDF”. A captura mostra prévia de 2 páginas; não comprova que o arquivo foi salvo.
- O usuário identifica o grupo como “SL”; a captura do relatório exibe “Grupo USL”. Essa diferença foi mantida sem inferir que os nomes são equivalentes.

## Análise

Há dois tipos de PDF que a aplicação pode produzir: ata e relatório mensal. O critério para considerar uma rota como entrega direta de PDF é o handler HTTP retornar `Content-Type: application/pdf`. Por esse critério, só a ata tem endpoint binário, com dois modos de disposição do mesmo arquivo: visualização inline e download.

O relatório mensal é uma página HTML preparada para impressão; o navegador cria o arquivo PDF. A página de pré-visualização da ata também é HTML e incorpora o endpoint binário. O endpoint de e-mail transporta o PDF da ata como anexo e retorna JSON ao cliente.

## Diagnóstico

A aplicação oferece dois fluxos de PDF no Responsável: (1) ata, iniciada em `/responsavel/atas` e servida por `GET /api/atas/[ataId]/pdf`; e (2) relatório mensal, iniciado em `/responsavel/relatorios` e gerado pela impressão do navegador. Existe uma única rota HTTP que retorna diretamente `application/pdf`: a rota da ata. `download=1` muda sua disposição para download sem criar outra rota.

## Grau de certeza

Alto para o código local: o handler define explicitamente o tipo e a disposição da resposta, e o teste correspondente verifica esses cabeçalhos. A classificação das páginas de relatório é demonstrada pelo uso de `window.print()`.

## Pontos ainda não comprovados

- Não foi feita chamada HTTP autenticada nesta investigação; não foi confirmado o comportamento de uma implantação remota.
- Os testes foram lidos, mas não executados.

responsavel/atas
responsavel/relatorios
