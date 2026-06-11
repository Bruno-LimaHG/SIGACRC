# SIGACRC

Sistema Informatizado para Gerenciamento de Agendamentos de Casamentos no Registro Civil.

Este projeto é um MVP acadêmico para o TCC. Ele simula o fluxo principal entre cliente e funcionário do cartório: cadastro, login, formulário de casamento, validação de CEP, geração de protocolo, acompanhamento e análise do pedido pelo escrevente.

## Funcionalidades implementadas

### Área pública

- Tela inicial institucional.
- Central de ajuda com orientações e documentos necessários.
- Consulta de protocolo.

### Área do cliente

- Cadastro de cliente.
- Login de cliente.
- Área do cliente com resumo dos pedidos.
- Formulário de casamento em 8 etapas.
- Validação de campos obrigatórios.
- Máscaras de CPF, RG, celular e CEP.
- Cálculo automático de idade.
- Anexos de documentos na etapa 8.
- Geração automática de protocolo.
- Tela de confirmação do protocolo.

### API de CEP

- API em Node.js/Express.
- Integração com ViaCEP.
- Aceita apenas CEPs localizados em Osasco/SP.
- Preenche automaticamente logradouro, bairro, cidade e UF.

### Área dos funcionários

- Login institucional simulado.
- Validação simulada por certificado digital/token.
- Painel do escrevente reformulado.
- Métricas de pedidos.
- Filtro por busca e status.
- Modal com detalhes do pedido.
- Listagem dos documentos anexados.
- Alteração de status.
- Registro de observação do escrevente.
- Histórico do pedido.

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript
- Node.js
- Express
- Axios
- CORS
- LocalStorage
- API ViaCEP

## Como rodar o projeto

Instale as dependências:

```bash
npm install
```

Inicie o servidor:

```bash
npm start
```

Acesse no navegador:

```text
http://localhost:3000
```

## Rotas úteis

```text
Tela inicial:
http://localhost:3000

Formulário:
http://localhost:3000/formulario_casamento/formulario_casamento.html

Painel do funcionário:
http://localhost:3000/painel_escrevente/painel_escrevente.html

Teste da API de status:
http://localhost:3000/api/status

Teste da API de CEP:
http://localhost:3000/cep/06010000
```

## Observação sobre dados

Nesta versão, os dados são armazenados no `localStorage` do navegador para fins de demonstração. Em uma versão real, seria necessário implementar autenticação segura, banco de dados, controle de permissões, criptografia e tratamento adequado de dados sensíveis.

## Fluxo de apresentação sugerido

1. Abrir a tela inicial.
2. Criar cadastro de cliente.
3. Entrar na área do cliente.
4. Iniciar novo pedido.
5. Preencher o formulário e anexar documentos.
6. Validar um CEP de Osasco/SP.
7. Finalizar e copiar o protocolo.
8. Abrir o painel do funcionário.
9. Analisar o pedido, alterar status e adicionar observação.
10. Voltar para acompanhamento e consultar o protocolo atualizado.

## Atualização visual e atendimento

Nesta versão, a identidade visual foi padronizada em tons de verde, removendo o laranja dos botões, links, cards e destaques principais.

Também foi incluído um fluxo de atendimento simulado:

- Na Área do Cliente, o usuário pode clicar em **Falar com escrevente** e enviar uma dúvida.
- A mensagem é salva no `localStorage` como simulação de banco de dados.
- No Painel do Funcionário, a seção **Mensagens dos clientes** lista os atendimentos recebidos.
- O escrevente pode abrir o atendimento, responder e a resposta aparece novamente para o cliente na área dele.

Esse recurso serve como MVP para demonstrar comunicação entre cliente e equipe interna sem exigir backend completo ou banco real nesta fase do TCC.

## Atualização visual da tela inicial

Nesta versão, a tela inicial recebeu uma identidade visual mais forte com predominância das duas tonalidades de verde do projeto. Também foram removidas mensagens desnecessárias de demonstração, como aviso automático de API online e texto de fluxo principal sobre a imagem.

A página inicial agora apresenta um texto mais humanizado sobre a proposta do SIGACRC, uma imagem institucional com o mesmo tamanho visual do card principal e um rodapé com direitos reservados.


## Ajustes visuais e controle de acesso

- A tela inicial foi reorganizada: o bloco principal voltou a ficar proporcional e os textos institucionais foram movidos para uma seção separada logo abaixo.
- A identidade visual foi reforçada com detalhes verdes nas telas principais, cartões, áreas de login, painel e componentes de atendimento.
- A Área do Cliente e o Formulário de Casamento exigem login. Caso alguém tente acessar sem autenticação, o sistema redireciona para o login e exibe um pop-up explicando a necessidade de entrar ou criar cadastro.
