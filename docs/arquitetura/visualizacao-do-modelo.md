# Visualização do modelo de dados

O arquivo [`modelo-de-dados.dbml`](modelo-de-dados.dbml) representa as sete abas do Google Sheets como um
modelo relacional. Ele serve para visualizar e exportar o desenho; não significa
que o MVP utilizará um banco de dados relacional.

## Abrir no dbdiagram.io

1. Acesse https://dbdiagram.io/.
2. Entre em sua conta e selecione **New Diagram**.
3. Escolha o formato **DBML**.
4. Abra `docs/arquitetura/modelo-de-dados.dbml` neste projeto.
5. Copie todo o conteúdo para o editor do dbdiagram.io.
6. Confirme que as sete tabelas e os seis relacionamentos foram renderizados.

## Organização sugerida

Posicione `atas` no centro e distribua:

- `grupos` à esquerda de `atas`;
- `servidores` e `participacao` acima e abaixo de `atas`;
- `visitantes`, `ingressos` e `trocas_chaveiro` à direita de `atas`.

O resultado deve mostrar:

- `grupos` 1:N `atas`;
- `atas` 1:N `servidores`;
- `atas` 1:N `participacao`;
- `atas` 1:N `visitantes`;
- `atas` 1:N `ingressos`;
- `atas` 1:N `trocas_chaveiro`.

## Exportar ou capturar

Para gerar o arquivo da imagem, use **Export > PNG** no dbdiagram.io. Se a
exportação não estiver disponível no plano da conta, ajuste o zoom para mostrar
todo o modelo e faça uma captura de tela.

Nome sugerido para salvar no projeto:

`docs/arquitetura/modelo-de-dados.png`

Antes de salvar, confirme que nomes de campos e relacionamentos estão legíveis e
que nenhuma credencial ou identificador real de planilha aparece na imagem.
