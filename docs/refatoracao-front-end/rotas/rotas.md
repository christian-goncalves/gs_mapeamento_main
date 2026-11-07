## CONCLUIDO:
- configurações

## FALTA CONCLUIR
### historico de atas
- Ata em modo de revisão esta no padrão antigo
- Modo visualização no padrão anrtigo dentro de historico de atas
- Modo PDF no padrão anrtigo dentro de historico de atas
- mODO de edição de ata esta no padrão antigo dentro de historico de atas
- Modal de exclusão padrão antigo no histoeico de atas

### Relatorios
- botão pdf

### Configurações
- botão pdf
- alterar senha



# Checklist de rotas para validação do front-end

## Atas

- [ ] Lista de atas: `/responsavel/atas`
  - [ ] Validar os botões **Aprovar selecionadas** e **Aprovar**.
  - [ ] Validar o acesso ao histórico: `/responsavel/atas?historico=1`.
  - [ ] Validar o layout em telas mobile.
- [ ] Nova ata: `/atas/nova`
  - [ ] Validar a revisão e a confirmação do envio.
- [ ] Visualizar ata: `/atas/[ataId]`
  - Exemplo: `/atas/389b11a0-c4ad-486d-88b7-bfdbc9b9ff04`
  - [ ] Validar os botões de edição, PDF e e-mail.
- [ ] Editar ata: `/atas/[ataId]/editar`
  - Exemplo: `/atas/389b11a0-c4ad-486d-88b7-bfdbc9b9ff04/editar`
- [ ] Visualizar PDF da ata: `/atas/[ataId]/pdf`
  - Exemplo: `/atas/389b11a0-c4ad-486d-88b7-bfdbc9b9ff04/pdf`
- [ ] Histórico de atas: `/responsavel/atas?historico=1`
  - [ ] Validar o layout em telas mobile.

## Relatórios

- [ ] Relatórios do responsável: `/responsavel/relatorios`
  - [ ] Validar o botão PDF: deve abrir a visualização, em vez de encaminhar diretamente para impressão.

## Configurações do grupo

- [ ] Dados do grupo: `/grupos/[grupoId]`
  - Exemplo: `/grupos/8806319f-dd2d-4b67-9416-ab42bb991870`
  - [ ] Validar o desalinhamento ao editar os dados do grupo.
  - [ ] Validar o modal e o fluxo de edição de e-mail.
  - [ ] Validar o popup para adicionar servidor.
  - [ ] Validar o popup para editar encargo.
  - [ ] Validar a edição da plataforma.
- [ ] Horários do grupo: `/grupos/[grupoId]?settingsSection=schedules`
  - Exemplo: `/grupos/8806319f-dd2d-4b67-9416-ab42bb991870?settingsSection=schedules`
  - [ ] Validar o botão **Editar horários**.
  - [ ] Ao adicionar horário, validar os quatro badges, placeholders e tamanhos.
  - [ ] Ao tentar adicionar sem horário, validar as cores da mensagem “Informe dia e hora de início antes de adicionar”.
  - [ ] Validar o popup de confirmação dos horários editados.
