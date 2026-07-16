Use este texto como instrução para o Codex:

---

Preciso que você faça uma análise técnica completa do projeto **GS Mapeamento** com base nas solicitações registradas na conversa de 14/07 e nas imagens associadas.

O objetivo desta etapa não é implementar todas as alterações imediatamente.

Primeiro, quero que você leia o projeto real, identifique a arquitetura atual, verifique os modelos, rotas, componentes, regras de negócio, persistência, autenticação, permissões e fluxos envolvidos. Depois disso, você deve organizar o trabalho em etapas seguras de implementação.

A pasta principal de documentação do projeto é:

```text
Docs
```

Crie um documento dentro dessa pasta, no subdiretório que considerar mais adequado, seguindo o padrão já existente no projeto. Antes de criar um novo arquivo, verifique se já existe uma estrutura para refatorações, planejamento técnico, histórico ou backlog. Evite duplicação documental.

O documento deve servir como plano técnico de execução da refatoração e deve permitir que as mudanças sejam implementadas em várias etapas, sem tentar alterar tudo de uma única vez.

## Objetivo da análise

Quero que você determine, com base no código existente:

* o que já está implementado;
* o que precisa ser alterado;
* o que é simples;
* o que envolve regra de negócio;
* o que exige alteração de banco ou migração;
* o que pode afetar autenticação, permissões ou segurança;
* o que depende de decisão de negócio;
* o que pode ser implementado isoladamente;
* o que possui dependências;
* o que apresenta risco de regressão;
* o que é possível ou não dentro da arquitetura atual.

Não assuma que todas as solicitações devem ser implementadas exatamente como descritas. Confronte cada pedido com a implementação real e registre inconsistências, riscos ou alternativas melhores.

## Diretriz de execução

Quero que o plano seja dividido em camadas, fases ou lotes de implementação.

Mudanças simples, como:

* troca de nomes;
* ajustes de labels;
* remoção visual de elementos;
* reposicionamento de botões;
* inclusão de ícones;
* ajustes de layout;
* exibição condicional simples;

devem ficar separadas das mudanças mais delicadas, como:

* alteração de modelo de dados;
* persistência;
* migrações;
* numeração de reuniões;
* prevenção de duplicidade;
* segurança de links;
* autenticação;
* permissões;
* edição de atas finalizadas;
* geração de PDF;
* histórico e auditoria.

A ideia é implementar por etapas, em vários ciclos, sempre preservando o funcionamento atual.

## Solicitações levantadas

### 1. Tela inicial do responsável pelo grupo

Analisar a viabilidade de:

* remover o bloco **Grupos ativos**;
* remover a exibição do e-mail do usuário no cabeçalho;
* substituir o título fixo **GS Mapeamento** pelo nome do grupo;
* posicionar o botão **Gerenciar** ao lado do nome do grupo;
* manter a seção de atas válidas;
* adicionar ações para visualizar e editar uma ata;
* adicionar opção para gerar ou baixar PDF da ata.

Verifique se o responsável pode estar associado a mais de um grupo. Caso possa, remover a lista de grupos pode gerar impacto funcional.

### 2. Cadastro e edição do grupo

Analisar:

* remoção do campo responsável pelo grupo;
* remoção do e-mail do responsável;
* permanência ou não do e-mail de login;
* dependências desses campos em autenticação, recuperação de senha, notificações, permissões ou vínculo com grupos;
* inclusão de um campo que registre o número da última reunião realizada antes da implantação do sistema;
* possibilidade de regenerar o link de preenchimento;
* impacto da alteração do link em acessos já distribuídos.

Não exclua campos de banco sem verificar todas as dependências.

### 3. Segurança do link de preenchimento

Analisar o modelo atual do link destinado aos servidores e propor uma solução segura.

Avaliar:

* token aleatório;
* regeneração do link;
* revogação de links anteriores;
* prazo de validade;
* vínculo com grupo;
* vínculo com reunião;
* uso único ou reutilizável;
* necessidade de autenticação;
* registro de uso;
* proteção contra acesso indevido;
* impacto em links já enviados.

Documente alternativas e recomende uma solução compatível com a arquitetura atual.

### 4. Informações gerais da ata

Analisar a implementação de:

* remoção do campo grupo quando o grupo já estiver determinado pelo login ou link;
* preenchimento automático do campo **Preenchido por**;
* inclusão do atributo duração;
* manutenção de data, horário, plataforma, tipo e formatos;
* inclusão da opção **Outros** nos formatos;
* abertura de campo de texto quando **Outros** for selecionado;
* revisão visual dos labels;
* compatibilidade entre perfil administrador, responsável e servidor.

Determine de onde deve vir o valor de **Preenchido por** de acordo com o fluxo atual.

### 5. Numeração e duplicidade de reuniões

Analisar e propor uma estrutura para:

* evitar duplicidade de registro;
* gerar número interno da reunião;
* manter número oficial ou histórico informado pelo grupo;
* considerar a última reunião anterior ao uso do sistema;
* exibir os dois números quando necessário.

Uma possível estrutura é:

```text
numero_sistema
numero_reuniao_grupo
ultima_reuniao_anterior
```

Não adote essa estrutura sem verificar se ela faz sentido para os modelos atuais.

Defina também possíveis critérios de duplicidade, por exemplo:

* grupo;
* data;
* horário;
* número oficial;
* combinação desses campos.

Indique qual regra é mais segura e quais impactos ela teria.

### 6. Participação

Analisar a substituição de selects por controles de incremento e decremento nos campos numéricos.

Possíveis campos:

* membros presentes;
* total de partilhas;
* quantidades de localidades;
* membros internacionais;
* demais contadores.

Verifique:

* limites mínimos;
* limites máximos;
* validação no front-end;
* validação no back-end;
* persistência;
* acessibilidade;
* responsividade.

Não defina limites arbitrários sem justificativa.

### 7. Localidade — cidades e UF

Analisar:

* manutenção de cidade e quantidade;
* adição e exclusão dinâmica de linhas;
* responsividade;
* exibição no resumo;
* cálculo do total;
* validação de duplicidade de cidade;
* persistência atual.

Verifique se o comportamento já existente atende parcialmente ao pedido.

### 8. Visitantes

Analisar a nova estrutura solicitada:

* remover nome preenchido manualmente;
* gerar identificador sequencial:

  * Visitante 1;
  * Visitante 2;
  * Visitante 3;
* manter cidade;
* manter descrição;
* manter como chegou a NA;
* incluir a opção **Não informado**;
* incluir marcação de ingresso dentro do visitante;
* remover a seção separada de ingressos.

Verifique se os quatro atributos finais são:

```text
identificador automático
cidade
descrição
como chegou a NA
```

Caso a implementação atual indique outra estrutura, documente a divergência.

Avalie também:

* se a numeração é por ata;
* se deve ser persistida ou apenas exibida;
* se a ordem pode mudar;
* se a exclusão de um visitante renumera os demais;
* se um visitante pode representar mais de um ingresso.

### 9. Ingressos

Analisar a remoção da seção independente **Ingressos** e a transformação do ingresso em propriedade do visitante.

Possível estrutura:

```text
[ ] Houve ingresso
```

Verifique o impacto em:

* banco de dados;
* relatórios;
* resumo da ata;
* PDF;
* dados já existentes;
* testes;
* compatibilidade retroativa.

### 10. Troca de ficha / Conquistas de tempo

Analisar:

* renomear **Troca de ficha** para **Conquistas de tempo**;
* substituir as opções atuais por:

  * 30 dias;
  * 60 dias;
  * 90 dias;
  * 6 meses;
  * 9 meses;
  * 1 ano;
  * 18 meses;
* manter somente a ação **Adicionar** quando a seção estiver vazia;
* verificar impacto no banco, relatórios e dados existentes.

Confirme se os valores atuais são textos, enums, números ou relacionamentos.

### 11. Membros internacionais

Analisar a inclusão ou ajuste da seção:

* remover localidade;
* manter país;
* manter quantidade;
* permitir múltiplos registros;
* permitir exclusão;
* mostrar no resumo e no PDF.

Verifique se essa estrutura já existe parcialmente.

### 12. Servidores

Analisar a inclusão de função para cada servidor.

Funções indicadas:

* coordenador;
* secretário;
* apoio;
* anfitrião;
* coanfitrião.

A estrutura preferencial parece ser:

```text
nome do servidor
função
```

Não substitua o nome pela função sem verificar o impacto.

Avalie:

* lista fixa ou configurável;
* enum no banco;
* select no front-end;
* múltiplas funções;
* duplicidade de função;
* exibição no resumo;
* exibição no PDF.

### 13. Resumo da ata

Analisar:

* alteração do título para **Resumo da ata**;
* exibição dos novos campos;
* número da reunião;
* duração;
* visitantes;
* ingressos integrados;
* conquistas de tempo;
* membros internacionais;
* funções dos servidores;
* ação de voltar e corrigir;
* ação de confirmar e enviar;
* consistência com a regra de edição posterior.

Existe um possível conflito:

* o resumo informa que a ata não poderá ser editada após o envio;
* a tela de atas solicita ação de visualizar e editar.

Esse conflito deve ser tratado como decisão de negócio.

### 14. Visualização, edição e PDF

Analisar a viabilidade de:

* visualizar ata;
* editar ata;
* gerar PDF;
* definir quem pode editar;
* definir até quando pode editar;
* manter histórico das alterações;
* registrar autor e data da edição;
* bloquear edição após determinado estado;
* preservar integridade dos dados.

Avalie se a geração de PDF já existe parcialmente no projeto.

## Pontos que exigem decisão de negócio

O documento deve destacar claramente os pontos que não podem ser decididos apenas pelo código:

1. Ata pode ser editada após o envio?
2. Quem pode editar?
3. Existe prazo para edição?
4. O campo **Preenchido por** vem de onde?
5. O link é permanente, temporário ou por reunião?
6. Quais são os limites máximos dos campos numéricos?
7. Qual é o critério oficial de duplicidade?
8. Como funciona a numeração histórica?
9. O servidor pode ter mais de uma função?
10. Um visitante pode representar mais de um ingresso?
11. Quais faixas adicionais existem em conquistas de tempo?
12. O responsável pode administrar mais de um grupo?

## Estrutura esperada do documento

O documento deve conter, no mínimo:

### 1. Contexto

Resumo da solicitação e objetivo da refatoração.

### 2. Estado atual do projeto

* arquitetura;
* stack;
* estrutura relevante;
* modelos;
* rotas;
* componentes;
* permissões;
* autenticação;
* persistência;
* geração de PDF;
* testes existentes.

### 3. Matriz de impacto

Para cada solicitação, informar:

* arquivo ou módulo afetado;
* front-end;
* back-end;
* banco;
* migração;
* autenticação;
* permissão;
* testes;
* risco;
* dependências.

### 4. Classificação por dificuldade

Classificar cada item como:

* baixa complexidade;
* média complexidade;
* alta complexidade;
* depende de decisão de negócio.

### 5. Classificação por risco

Classificar como:

* baixo risco;
* risco moderado;
* alto risco.

### 6. Fases de implementação

Organize em lotes pequenos e seguros.

Sugestão inicial:

#### Fase 1 — Ajustes visuais e textuais

* troca de títulos;
* labels;
* ícones;
* reposicionamento;
* remoção apenas visual de elementos sem dependência;
* ajustes de layout.

#### Fase 2 — Campos simples e comportamento de formulário

* duração;
* formato outros;
* controles numéricos;
* função de servidor;
* membros internacionais;
* ajustes de visitantes sem migração complexa.

#### Fase 3 — Alterações estruturais de dados

* visitantes;
* ingressos;
* conquistas de tempo;
* campos do grupo;
* migrações;
* compatibilidade com dados existentes.

#### Fase 4 — Numeração e duplicidade

* número interno;
* número histórico;
* última reunião anterior;
* restrições;
* validações;
* mensagens de erro.

#### Fase 5 — Segurança e permissões

* regeneração de link;
* revogação;
* expiração;
* autenticação;
* autorização;
* auditoria.

#### Fase 6 — Ciclo de vida da ata

* visualizar;
* editar;
* bloquear;
* versionar;
* registrar alterações;
* definir estados.

#### Fase 7 — Resumo, relatórios e PDF

* atualização do resumo;
* atualização dos relatórios;
* geração de PDF;
* compatibilidade com novos campos.

#### Fase 8 — Testes e regressão

* testes unitários;
* testes de integração;
* testes de permissão;
* testes de migração;
* testes de responsividade;
* testes dos fluxos completos.

Essa divisão é apenas uma referência. Ajuste conforme a arquitetura real do projeto.

### 7. Plano de migração

Caso existam alterações de banco, documente:

* campos adicionados;
* campos removidos;
* campos renomeados;
* transformação de dados;
* compatibilidade;
* rollback;
* backup;
* risco de perda de dados.

### 8. Critérios de aceite

Defina critérios objetivos para cada fase.

### 9. Plano de testes

Inclua:

* cenários normais;
* cenários de erro;
* permissões;
* dados antigos;
* links antigos;
* duplicidade;
* edição;
* PDF;
* responsividade.

### 10. Pendências de decisão

Liste apenas decisões realmente necessárias antes da implementação.

### 11. Ordem recomendada

Apresente a ordem final sugerida, considerando:

* dependências;
* segurança;
* risco;
* esforço;
* valor entregue;
* facilidade de validação.

## Regras importantes

* Não implemente nada nesta etapa.
* Não altere banco.
* Não crie migrações.
* Não remova campos.
* Não faça refatorações preventivas.
* Não presuma regras de negócio.
* Não trate as sugestões acima como verdade absoluta.
* Use o código real como fonte principal.
* Registre evidências com caminhos de arquivos.
* Aponte divergências entre solicitação e implementação.
* Preserve o funcionamento atual.
* Estruture o plano para execução em vários ciclos pequenos.
* Priorize baixo risco antes de alterações estruturais.
* Separe mudanças visuais de mudanças de domínio.

## Entrega esperada

Ao final:

1. informe qual documento foi criado ou atualizado;
2. informe o caminho completo;
3. apresente um resumo da arquitetura encontrada;
4. apresente a divisão final das fases;
5. destaque os itens de maior risco;
6. destaque as decisões de negócio pendentes;
7. informe qual seria o primeiro lote seguro de implementação;
8. não inicie a implementação sem nova autorização.

---
