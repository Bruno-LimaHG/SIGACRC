# SIGACRC — Sistema Integrado (projeto unificado)

Sistema de gestão de pedidos de casamento com **frontend web** + **API Node.js** + **MongoDB** + **AWS S3**.

## Como executar (desenvolvimento)

### 1. MongoDB

Instale e inicie o MongoDB localmente, ou use Docker:

```bash
docker run -d -p 27017:27017 --name mongo-sigacrc mongo:7
```

### 2. Configuração

```bash
cd SIGACRC
copy .env.example .env
npm install
```

### 3. Migrar dados antigos (opcional)

Se você usava os arquivos `data/*.json`:

```bash
npm run migrar
```

### 4. Iniciar

```bash
npm start
```

Acesse: **http://localhost:3000**

---

## Deploy no Windows 10 (hospedagem)

Guia completo em duas partes (MongoDB + hospedar o site):

**[DEPLOY-WINDOWS-10.md](./DEPLOY-WINDOWS-10.md)** (Nota: os guias foram removidos do repositório)

- **Parte A** — Instalar e configurar o MongoDB  
- **Parte B** — Publicar o SIGACRC no PC (Node.js, PM2, firewall, acesso na rede)

---

## Fluxo do sistema

1. **Cliente** — Login ou cadastro → formulário de casamento → upload de documentos no AWS S3 → pedido salvo no MongoDB
2. **CEP** — Consulta ViaCEP (somente Osasco/SP)
3. **Funcionário (Escrevente)** — Login → painel → aprovar/recusar pedidos → visualizar documentos usando URLs Pré-Assinadas seguras
4. **Comunicação** — Cliente e funcionário se comunicam por um módulo de "Atendimentos"

---

## Estrutura

```
SIGACRC/
  server.js
  .env                 # Configurações de Banco, AWS, Auth
  models/              # Schemas do Mongoose (Pedido, Usuario, etc.)
  db/                  # Funções de acesso ao banco
  public/              # Interface web (Vanilla JS, CSS, HTML)
  services/            # Serviços de terceiros (ex: s3Service.js)
  diagramas/           # Documentação UML em formato Mermaid
```

---

## APIs

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/cep/:cep` | Consulta CEP (Osasco/SP) |
| GET | `/api/pedidos` | Lista pedidos |
| POST | `/api/pedidos` | Novo pedido |
| PATCH | `/api/pedidos/:id` | Atualiza status |
| POST | `/api/usuarios` | Cadastro de cliente |
| POST | `/api/auth/login` | Login de cliente |
| GET | `/api/atendimentos` | Histórico de atendimentos do usuário |
| POST | `/api/atendimentos` | Cria ou responde a um atendimento |
| GET | `/api/documentos/download`| Retorna Pre-Signed URL para visualizar arquivo na AWS S3 |

---

## Variáveis de ambiente

| Variável | Exemplo | Descrição |
|----------|---------|-----------|
| `PORT` | `3000` | Porta do servidor |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/sigacrc` | Conexão MongoDB |
| `JWT_SECRET` | `sua-chave-secreta` | Token JWT para sessões |
| `AWS_ACCESS_KEY_ID` | `AKIA...` | Credenciais AWS IAM |
| `AWS_SECRET_ACCESS_KEY`| `...` | Credenciais AWS IAM |
| `AWS_REGION` | `us-east-1` | Região do Bucket S3 |
| `AWS_BUCKET_NAME` | `sigacrc-docs` | Nome do Bucket S3 |
