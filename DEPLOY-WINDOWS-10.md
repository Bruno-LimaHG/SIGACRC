# SIGACRC no Windows 10 — Guia completo

Passo a passo em duas partes:

- **Parte A** — Instalar e configurar o **MongoDB**
- **Parte B** — **Hospedar** o site SIGACRC no seu PC

> Use este PC como “servidor”: ele precisa ficar ligado e conectado à rede para outras pessoas acessarem o sistema.

---

# PARTE A — MongoDB no Windows 10

## Passo A1 — Baixar o MongoDB

1. Acesse: https://www.mongodb.com/try/download/community  
2. Selecione:
   - **Version:** 7.0 (ou a mais recente estável)
   - **Platform:** Windows
   - **Package:** MSI  
3. Clique em **Download**.

---

## Passo A2 — Instalar

1. Execute o arquivo `.msi` baixado.  
2. Clique em **Next** até chegar em **Service Configuration**:
   - Marque **Install MongoDB as a Service**
   - Service Name: `MongoDB`
   - Marque **Run service as Network Service user**
   - Marque **Start the MongoDB service** (iniciar automaticamente)
3. Em **Install MongoDB Compass** pode deixar marcado (ferramenta visual — opcional).  
4. Conclua a instalação com **Finish**.

---

## Passo A3 — Verificar se o MongoDB está rodando

1. Pressione `Win + R`, digite `services.msc` e Enter.  
2. Procure o serviço **MongoDB Server (MongoDB)**.  
3. O **Status** deve estar **Em execução** (Running).  
4. Se estiver parado: clique com o botão direito → **Iniciar**.

**Teste no PowerShell:**

```powershell
mongosh
```

Se abrir algo como `test>`, o MongoDB está OK. Digite `exit` e Enter para sair.

Se `mongosh` não for reconhecido, feche e abra o PowerShell de novo (ou reinicie o PC).

---

## Passo A4 — Criar o banco do SIGACRC (primeira vez)

No PowerShell:

```powershell
mongosh
```

Cole os comandos abaixo (um por vez ou todos juntos):

```javascript
use sigacrc
db.createCollection("pedidos")
db.createCollection("usuarios")
show collections
exit
```

O banco **`sigacrc`** será usado automaticamente pelo sistema quando você iniciar o site.

---

## Passo A5 — (Opcional) Usuário e senha no MongoDB

Para uso em rede local, o MongoDB só em `127.0.0.1` já é suficiente.  
Se quiser senha:

```javascript
use admin
db.createUser({
  user: "sigacrc",
  pwd: "ColoqueUmaSenhaForte123",
  roles: [{ role: "readWrite", db: "sigacrc" }]
})
exit
```

No arquivo `.env` do projeto (Parte B), use:

```env
MONGODB_URI=mongodb://sigacrc:ColoqueUmaSenhaForte123@127.0.0.1:27017/sigacrc?authSource=admin
```

---

## Passo A6 — Compass (opcional — ver dados na interface)

1. Abra **MongoDB Compass** (instalado com o MongoDB).  
2. Conecte em: `mongodb://127.0.0.1:27017`  
3. Você verá o banco **`sigacrc`** com as coleções `pedidos` e `usuarios` após usar o site.

---

# PARTE B — Hospedar o SIGACRC no Windows 10

## Passo B1 — Instalar o Node.js

1. Acesse: https://nodejs.org/  
2. Baixe a versão **LTS** (recomendada).  
3. Instale com as opções padrão (incluir no PATH).  
4. Teste no PowerShell:

```powershell
node -v
npm -v
```

Deve aparecer algo como `v20.x.x` e `10.x.x`.

---

## Passo B2 — Colocar o projeto no PC

Copie a pasta **`SIGACRC`** para um local fixo, por exemplo:

```
C:\SIGACRC
```

A pasta deve conter: `server.js`, `package.json`, `public`, `models`, `db`, etc.

> Não é obrigatório copiar a pasta `node_modules` — ela será criada no próximo passo.

---

## Passo B3 — Configurar o arquivo `.env`

1. Abra o PowerShell.  
2. Execute:

```powershell
cd C:\SIGACRC
copy .env.example .env
notepad .env
```

3. Deixe assim (ajuste o caminho se sua pasta for outra):

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/sigacrc
```

4. Salve e feche o Bloco de Notas.

---

## Passo B4 — Instalar dependências do projeto

No PowerShell, na pasta do projeto:

```powershell
cd C:\SIGACRC
npm install
```

Aguarde terminar sem erros.

---

## Passo B5 — Migrar dados antigos (se existirem)

Se você já usou o sistema com arquivos `data\pedidos.json` e `data\usuarios.json`:

```powershell
npm run migrar
```

Deve aparecer quantos pedidos e usuários foram importados.

---

## Passo B6 — Testar o site manualmente

```powershell
npm start
```

Você deve ver:

- `MongoDB conectado`
- `SIGACRC rodando em http://localhost:3000`

No navegador deste PC, abra:

- http://localhost:3000

Teste login, cadastro e formulário. Para parar o teste: `Ctrl + C` no PowerShell.

---

## Passo B7 — Descobrir o IP do PC na rede

No PowerShell:

```powershell
ipconfig
```

Anote o **Endereço IPv4** da sua rede (ex.: `192.168.1.50`).

Outros computadores na mesma rede Wi‑Fi/cabo acessam:

```
http://192.168.1.50:3000
```

(substitua pelo seu IP)

---

## Passo B8 — Liberar a porta no Firewall do Windows 10

**Opção 1 — PowerShell (como Administrador):**

```powershell
New-NetFirewallRule -DisplayName "SIGACRC Site" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

**Opção 2 — Interface gráfica:**

1. **Painel de Controle** → **Sistema e Segurança** → **Firewall do Windows Defender**  
2. **Configurações avançadas** → **Regras de Entrada** → **Nova Regra**  
3. Tipo: **Porta** → TCP → **3000** → **Permitir conexão**  
4. Nome: `SIGACRC Site`

> **Não** libere a porta **27017** (MongoDB) para a internet — só o site na 3000, se precisar de acesso na rede local.

---

## Passo B9 — Manter o site sempre ligado (PM2)

Assim o SIGACRC continua rodando se você fechar o PowerShell e pode iniciar com o Windows.

```powershell
npm install -g pm2
npm install -g pm2-windows-startup
```

Na pasta do projeto:

```powershell
cd C:\SIGACRC
pm2 start ecosystem.config.cjs
pm2 save
pm2-startup install
```

Confirme quando o instalador pedir.

| Comando | O que faz |
|---------|-----------|
| `pm2 status` | Ver se está online |
| `pm2 logs sigacrc` | Ver erros / log |
| `pm2 restart sigacrc` | Reiniciar após atualizar arquivos |
| `pm2 stop sigacrc` | Parar o site |

---

## Passo B10 — Iniciar com o Windows (opcional)

O comando `pm2-startup install` (passo B9) já configura isso.

Após reiniciar o PC, aguarde 1–2 minutos e teste:

- http://localhost:3000  
- http://SEU_IP:3000 (de outro PC na rede)

---

## Passo B11 — Atualizar o sistema no futuro

1. Substitua os arquivos do projeto em `C:\SIGACRC` (menos `node_modules` e `.env`).  
2. No PowerShell:

```powershell
cd C:\SIGACRC
npm install
pm2 restart sigacrc
```

---

# Resumo rápido

| O quê | Onde / Como |
|-------|-------------|
| Banco de dados | MongoDB, banco `sigacrc` |
| Site | Node.js, porta **3000** |
| Neste PC | http://localhost:3000 |
| Outros PCs na rede | http://IP_DO_PC:3000 |
| Manter rodando | PM2 (`pm2 start`) |

---

# Problemas comuns

| Sintoma | Solução |
|---------|---------|
| `Falha ao iniciar` / erro MongoDB | Verifique o serviço **MongoDB** em `services.msc` |
| `mongosh` não encontrado | Reinicie o PC após instalar o MongoDB |
| Site só abre neste PC | Libere a porta 3000 no Firewall (passo B8) |
| Outro PC não acessa | Mesma rede Wi‑Fi; use o IPv4 correto (`ipconfig`) |
| Pedidos sumiram | Rode `npm run migrar` ou cadastre de novo |
| PC dorme e site cai | Em Energia, desative suspensão ou use PC que fica ligado |

---

# Checklist final

**MongoDB**

- [ ] MongoDB instalado (MSI)
- [ ] Serviço MongoDB **Em execução**
- [ ] `mongosh` conecta
- [ ] Banco `sigacrc` criado (passo A4)

**Hospedagem**

- [ ] Node.js LTS instalado
- [ ] Projeto em `C:\SIGACRC` (ou pasta escolhida)
- [ ] Arquivo `.env` configurado
- [ ] `npm install` OK
- [ ] `npm start` testado no navegador
- [ ] Firewall: porta 3000 liberada
- [ ] PM2: `pm2 start` + `pm2 save` + `pm2-startup install`
- [ ] Teste de outro PC na rede com `http://IP:3000`
