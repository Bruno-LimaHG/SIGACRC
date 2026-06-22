# SIGACRC — Sistema Integrado (projeto unificado)

Sistema de gestão de pedidos de casamento com **frontend web** + **API Node.js** + **MongoDB**.

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

**[DEPLOY-WINDOWS-10.md](./DEPLOY-WINDOWS-10.md)**

- **Parte A** — Instalar e configurar o MongoDB  
- **Parte B** — Publicar o SIGACRC no PC (Node.js, PM2, firewall, acesso na rede)

---

## Fluxo do sistema

1. **Cliente** — Login ou cadastro → formulário de casamento → pedido salvo no MongoDB
2. **CEP** — Consulta ViaCEP (somente Osasco/SP)
3. **Funcionário** — Login escrevente → token → painel (aprovar/recusar pedidos)

---

## Estrutura

```
SIGACRC/
  server.js
  .env                 # MONGODB_URI, PORT
  models/              # Pedido, Usuario
  db/                  # Funções de banco
  public/              # Interface web
  scripts/             # Migração JSON → MongoDB
  data/                # Backup JSON (legado)
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

---

## Variáveis de ambiente

| Variável | Exemplo | Descrição |
|----------|---------|-----------|
| `PORT` | `3000` | Porta do servidor |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/sigacrc` | Conexão MongoDB |
