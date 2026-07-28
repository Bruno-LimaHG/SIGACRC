# SIGACRC — Sistema Integrado de Gestão de Atendimento de Cartório de Registro Civil

Sistema de gestão unificado de pedidos de casamento civil com **Frontend Web** (Vanilla JS/CSS/HTML5), **API REST Node.js/Express**, **Banco de Dados MongoDB**, **Armazenamento de Arquivos AWS S3 (URLs Pré-Assinadas)**, **Autenticação Segura JWT**, **Logging Estruturado (Winston/Morgan)**, **Testes Automatizados (Jest/Supertest)** e **Conformidade com a LGPD**.

---

## Destaques de Arquitetura & Segurança

- 🔒 **Autenticação via JWT (JSON Web Token)**: Autenticação stateless segura através do cabeçalho HTTP `Authorization: Bearer <token>`. Removidos todos os fallbacks legados inseguros (ex: cabeçalhos `x-user-id` simulados).
- 🛡️ **Segurança de Documentos S3 (Pre-Signed URLs)**: Anexos e certidões são protegidos na AWS S3 e acessados mediante URLs pré-assinadas geradas temporariamente pelo backend (`@aws-sdk/client-s3`), sem exposição pública dos buckets ou credenciais.
- 📊 **Logging Estruturado & Auditoria**: Integração com **Winston** e **Morgan** (`utils/logger.js`) para rastreamento completo de requisições HTTP e capturas globais de erros no servidor.
- 🚦 **Proteção contra Força Bruta & DDoS**: Limitação de taxa de requisições (`express-rate-limit`) e proteção de cabeçalhos HTTP com **Helmet**.
- ⚖️ **Conformidade com a LGPD**: O sistema implementa boas práticas de proteção de dados pessoais e privacidade de requerentes, documentadas na [Política de Privacidade LGPD](./politica_lgpd.md).
- 🧪 **Testes Automatizados & CI**: Suíte de testes automatizados de integração e de API implementada com **Jest** e **Supertest** (`npm test`).
- 💾 **Rotina Automatizada de Backup**: Script autônomo para exportação de dados críticos das coleções MongoDB (`npm run backup`).

---

## Como executar (desenvolvimento)

### 1. MongoDB

Instale e inicie o MongoDB localmente, ou execute via Docker:

```bash
docker run -d -p 27017:27017 --name mongo-sigacrc mongo:7
```

### 2. Configuração inicial

```bash
cd SIGACRC
cp .env.example .env
npm install
```

> **Nota:** Certifique-se de configurar em seu `.env` a chave secreta de autenticação `JWT_SECRET` e, caso utilize o S3 real, as credenciais AWS IAM. Em desenvolvimento local, o sistema executa fallback com mock local transparente caso as credenciais AWS não estejam configuradas.

### 3. Migração de dados antigos (opcional)

Caso possua bases nos arquivos de legado `data/*.json`:

```bash
npm run migrar
```

### 4. Iniciar o servidor

```bash
npm start
# ou em modo desenvolvimento:
npm run dev
```

Acesse a interface no navegador: **http://localhost:3000**

---

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm start` / `npm run dev` | Inicia o servidor Node.js/Express na porta configurada (`PORT` ou `3000`) |
| `npm test` | Executa a suíte de testes automatizados de API com **Jest** e **Supertest** |
| `npm run backup` | Executa a rotina automática de backup do banco de dados MongoDB para a pasta `/backups` |
| `npm run migrar` | Realiza a migração de arquivos JSON legados para as coleções do MongoDB |

---

## Deploy no Windows 10 (hospedagem)

Guia completo em duas partes (MongoDB + hospedar o site):

**[DEPLOY-WINDOWS-10.md](./DEPLOY-WINDOWS-10.md)** (Nota: os guias foram removidos do repositório ou encontram-se arquivados)

- **Parte A** — Instalar e configurar o MongoDB  
- **Parte B** — Publicar o SIGACRC no PC (Node.js, PM2, firewall, acesso na rede)

---

## Fluxo do Sistema

1. **Cliente / Requerente** — Cadastro e login seguro com token JWT → preenchimento interativo das etapas do formulário de casamento → upload de documentos civis para a AWS S3 → registro do processo no MongoDB.
2. **Consulta CEP** — Consulta automatizada de endereço via integração com ViaCEP (foco em Osasco/SP e região).
3. **Funcionário (Escrevente / Oficial)** — Login administrativo → painel de controle → análise documental, alteração de status (Em Análise, Exigência Documental, Aprovado, Recusado) → visualização segura dos anexos através de **URLs Pré-Assinadas (Pre-Signed URLs)**.
4. **Comunicação por Atendimentos** — Clientes e cartório comunicam-se de forma assíncrona pelo módulo integrado de "Atendimentos" (tickets com histórico de conversa e trâmite).
5. **Conformidade LGPD** — Todos os dados dos titulares são geridos observando a transparência e as diretrizes da [Política LGPD](./politica_lgpd.md).

---

## Estrutura de Diretórios

```
SIGACRC/
  server.js            # Entry point da API Node.js/Express, middlewares de segurança e rotas
  package.json         # Dependências do projeto e scripts de execução/testes/backup
  .env                 # Configurações de Banco de Dados, AWS S3, Auth (JWT_SECRET)
  models/              # Schemas do Mongoose (Pedido, Usuario, Atendimento)
  db/                  # Conexão MongoDB e repositórios de acesso a dados
  public/              # Interface web (Vanilla JavaScript ES6+, HTML5, CSS3 com tema claro/escuro)
    area_cliente/      # Painel logado do cliente
    formulario_casamento/ # Módulo em 8 etapas assíncronas para pedido de casamento
    painel_escrevente/ # Painel operacional do escrevente do cartório
    painel_oficial/    # Painel gerencial e administrativo do oficial
    protocolo/         # Visualização de comprovantes e status de protocolos
  services/            # Integrações externas (ex: s3Service.js com @aws-sdk/client-s3)
  utils/               # Utilitários globais de sistema (ex: logger.js com Winston/Morgan)
  scripts/             # Scripts administrativos (migrações de dados e backup.js)
  __tests__/           # Testes automatizados de API (Jest/Supertest)
  backups/             # Diretório de armazenamento das exportações periódicas do banco
  diagramas/           # Documentação UML complementar em formato Mermaid
  politica_lgpd.md     # Diretrizes e política de privacidade sob a LGPD
  documentacao_tecnica.md # Documentação arquitetural e técnica detalhada do projeto
```

---

## APIs REST Principais

Todas as rotas protegidas exigem o envio do token de autenticação no cabeçalho:  
`Authorization: Bearer <seu-jwt-token>`

| Método | Rota | Autenticação | Descrição |
|--------|------|--------------|-----------|
| **GET** | `/cep/:cep` | Pública | Proxy de consulta ViaCEP (com formatação local) |
| **POST** | `/api/auth/login` | Pública | Autenticação de clientes e emissão de token JWT |
| **POST** | `/api/usuarios` | Pública | Cadastro de novos clientes / requerentes |
| **GET** | `/api/pedidos` | **JWT Protegida** | Lista pedidos (filtrados por cliente ou todos para funcionários) |
| **POST** | `/api/pedidos` | **JWT Protegida** | Cria novo pedido de casamento (anexos e dados) |
| **GET** | `/api/pedidos/:protocolo`| **JWT Protegida** | Visualiza detalhes completos de um pedido específico |
| **PUT** | `/api/pedidos/:protocolo`| **JWT Protegida** | Edita e reenvia pedido em Exigência Documental |
| **PATCH**| `/api/pedidos/:id` | **JWT Protegida** | Atualiza status do processo (exclusivo para funcionários) |
| **GET** | `/api/atendimentos` | **JWT Protegida** | Retorna histórico de atendimentos e chamados abertos |
| **POST** | `/api/atendimentos` | **JWT Protegida** | Abre novo chamado de atendimento com o cartório |
| **PATCH**| `/api/atendimentos/:id` | **JWT Protegida** | Responde a um atendimento existente |
| **GET** | `/api/documentos/download`| **JWT Protegida** | Emite Pre-Signed URL segura da AWS S3 para visualização de anexo |

---

## Variáveis de Ambiente (`.env`)

| Variável | Exemplo | Descrição |
|----------|---------|-----------|
| `PORT` | `3000` | Porta de execução do servidor Express |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/sigacrc` | String de conexão com o MongoDB |
| `JWT_SECRET` | `chave-secreta-forte-e-segura` | Segredo de assinatura de tokens JWT para sessões |
| `AWS_ACCESS_KEY_ID` | `AKIA...` | Credenciais IAM da AWS (para acesso S3) |
| `AWS_SECRET_ACCESS_KEY`| `...` | Credenciais IAM da AWS |
| `AWS_REGION` | `us-east-1` | Região AWS do Bucket S3 |
| `AWS_BUCKET_NAME` | `sigacrc-docs` | Nome do Bucket S3 destinado a documentos civis |

---

## Testes Automatizados

O SIGACRC possui uma suíte de testes unitários e de integração de API utilizando **Jest** e **Supertest**. Os testes validam as camadas de autenticação JWT, emissão de tokens, criação de pedidos de casamento, rejeição de acessos sem credencial (`401` / `403`) e geração de URLs pré-assinadas.

Para rodar os testes localmente:

```bash
npm test
```

---

## Documentação Técnica Complementar

Para conferir diagramas UML de sequência e estado, modelagem de dados, arquitetura detalhada e especificações técnicas completas, consulte o arquivo **[documentacao_tecnica.md](./documentacao_tecnica.md)**.
