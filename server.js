require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");

const { conectarMongo } = require("./db/connect");
const pedidosDb = require("./db/pedidos");
const usuariosDb = require("./db/usuarios");
const atendimentosDb = require("./db/atendimentos");
const { uploadBase64ParaS3 } = require("./services/s3Service");

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "943014478378-edc20egje94rlrbq4m8fsetmtdm03qlo.apps.googleusercontent.com");
const Recuperacao = require("./models/Recuperacao");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("ERRO FATAL: JWT_SECRET não está definido no .env");
    process.exit(1);
}

// Limite de requisições para evitar Força Bruta
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // 10 tentativas de login/esqueci-senha por IP
    validate: { xForwardedForHeader: false },
    message: { erro: "Muitas tentativas. Tente novamente mais tarde." }
});

const helmet = require('helmet');
app.use(helmet());
app.use(cors({ origin: "*" })); // Em produção na VM da AWS, trocar '*' pela URL do seu front-end
app.use(express.json({ limit: "25mb" }));
app.use(express.static(PUBLIC_DIR));

// --- Middleware de Proteção ---
const autenticar = (req, res, next) => {
    // Tenta pegar o token do cabeçalho Authorization ou do x-user-id como fallback legado
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) return res.status(403).json({ erro: "Acesso negado: Token inválido ou expirado" });
            req.user = user;
            next();
        });
    } else {
        const userId = req.headers['x-user-id'];
        if (!userId || userId === "sem-id") {
            return res.status(403).json({ erro: "Acesso negado: Usuário não autenticado" });
        }
        next();
    }
};

function formatarData(iso) {
    if (!iso) return "";
    const [ano, mes, dia] = iso.split("-");
    if (!ano || !mes || !dia) return iso;
    return `${dia}/${mes}/${ano}`;
}

// Rotas Limpas (Clean URLs)
app.get("/", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "tela_inicial", "tela_inicial.html")));
app.get("/cadastro", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "cadastro_clientes", "cadastro_clientes.html")));
app.get("/login", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "login_clientes", "login_clientes.html")));
app.get("/login-funcionarios", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "login_escreventes", "login_escreventes.html")));
app.get("/login-oficial", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "login_oficial", "login_oficial.html")));
app.get("/painel", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "painel", "painel.html")));
app.get("/painel-funcionario", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "painel_escrevente", "painel_escrevente.html")));
app.get("/painel-oficial", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "painel_oficial", "painel_oficial.html")));
app.get("/area-cliente", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "area_cliente", "area_cliente.html")));
app.get("/formulario", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "formulario_casamento", "formulario_casamento.html")));
app.get("/acompanhamento", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "acompanhamento", "acompanhamento.html")));
app.get("/protocolo", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "protocolo", "protocolo.html")));
app.get("/central-ajuda", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "central_ajuda", "central_ajuda.html")));

// API DE CEP
app.get("/cep/:cep", async (req, res) => {
    const cep = req.params.cep.replace(/\D/g, "");
    if (!/^\d{8}$/.test(cep)) return res.status(400).json({ erro: "CEP inválido" });
    try {
        const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
        if (response.data.erro) return res.status(404).json({ erro: "CEP não encontrado" });
        const cidade = (response.data.localidade || "").toUpperCase();
        const uf = (response.data.uf || "").toUpperCase();
        if (cidade !== "OSASCO" || uf !== "SP") return res.status(403).json({ erro: "CEP fora do município de Osasco" });
        res.json(response.data);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ erro: "Erro ao se comunicar com a API de CEP" });
    }
});

// API DE PEDIDOS
app.get("/api/pedidos", async (req, res) => {
    try {
        const pedidos = await pedidosDb.listarPedidos();
        res.json(pedidos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao listar pedidos" });
    }
});

app.get("/api/pedidos/:id", async (req, res) => {
    try {
        const pedido = await pedidosDb.buscarPedidoPorId(req.params.id);
        if (!pedido) {
            return res.status(404).json({ erro: "Pedido não encontrado" });
        }
        res.json(pedido);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao buscar pedido" });
    }
});

// ROTA PROTEGIDA
app.post("/api/pedidos", autenticar, async (req, res) => {
    try {
        const body = req.body || {};
        
        // --- Processamento de arquivos para o S3 ---
        const documentosProcessados = [];
        const anexosBrutos = Array.isArray(body.documentosAnexos) ? body.documentosAnexos : [];
        
        for (const anexo of anexosBrutos) {
            if (anexo.dados && anexo.dados.startsWith("data:")) {
                // Sobe o Base64 pra AWS e pega a URL
                try {
                    const urlAws = await uploadBase64ParaS3(anexo.dados, anexo.nome || anexo.rotulo);
                    documentosProcessados.push({
                        id: anexo.id,
                        rotulo: anexo.rotulo,
                        nome: anexo.nome,
                        tipo: "url_s3",
                        dados: urlAws // Substitui o arquivo pesado pela URL pública
                    });
                } catch(e) {
                    console.error("Falha ao subir pro S3, salvando vazio:", e);
                    documentosProcessados.push(anexo);
                }
            } else {
                documentosProcessados.push(anexo);
            }
        }

        const novo = await pedidosDb.criarPedido({
            solicitante: body.solicitante || "Não informado",
            conjuge: body.conjuge || "Não informado",
            tipo: body.tipo || "Não informado",
            cpf: body.cpf || "",
            status: "Pendente",
            data: body.data || formatarData(new Date().toISOString().slice(0, 10)),
            testemunha1: body.testemunha1 || "",
            testemunha2: body.testemunha2 || "",
            documentos: Array.isArray(body.documentos) ? body.documentos : [],
            documentosAnexos: documentosProcessados,
            dadosCompletos: body.dadosCompletos || {}
        });
        res.status(201).json(novo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao salvar pedido" });
    }
});

// ROTA PROTEGIDA
app.patch("/api/pedidos/:id", autenticar, async (req, res) => {
    try {
        if (!req.body.status) return res.status(400).json({ erro: "Status não informado" });
        const pedido = await pedidosDb.atualizarStatusPedido(req.params.id, req.body.status);
        if (!pedido) return res.status(404).json({ erro: "Pedido não encontrado" });
        res.json(pedido);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao atualizar pedido" });
    }
});

app.put("/api/pedidos/:id", async (req, res) => {
    try {
        const body = req.body;
        const documentosProcessados = [];
        
        if (body.documentos && Array.isArray(body.documentos)) {
            for (const anexo of body.documentos) {
                if (anexo.dados && anexo.dados.startsWith("data:")) {
                    const urlAws = await uploadBase64ParaS3(anexo.dados, anexo.nome || anexo.rotulo);
                    documentosProcessados.push({
                        id: anexo.id,
                        rotulo: anexo.rotulo,
                        nome: anexo.nome,
                        tipo: "url_s3",
                        dados: urlAws
                    });
                } else {
                    documentosProcessados.push(anexo);
                }
            }
        }

        const dadosAtualizados = {
            solicitante: body.solicitante,
            conjuge: body.conjuge,
            tipo: body.tipo,
            cpf: body.cpf,
            dadosCompletos: body.dadosCompletos,
            documentos: documentosProcessados.length > 0 ? documentosProcessados : body.documentos,
            status: "Pendente"
        };

        const pedidoAtualizado = await pedidosDb.atualizarPedidoCompleto(req.params.id, dadosAtualizados);
        
        if (!pedidoAtualizado) return res.status(404).json({ erro: "Pedido não encontrado" });
        res.json(pedidoAtualizado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao atualizar pedido" });
    }
});

// API DE USUÁRIOS
app.post("/api/usuarios", async (req, res) => {
    try {
        const { nome, email, cpf, senha, perfil } = req.body || {};
        if (!nome || !email || !cpf || !senha) return res.status(400).json({ erro: "Preencha todos os campos" });
        if (senha.length < 4) return res.status(400).json({ erro: "Senha muito curta" });
        if (await usuariosDb.existeUsuario(email, cpf)) return res.status(409).json({ erro: "E-mail ou CPF já cadastrado" });
        await usuariosDb.criarUsuario({ nome, email, cpf, senha, perfil });
        res.status(201).json({ mensagem: "Cadastro realizado com sucesso" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao cadastrar usuário" });
    }
});

// Listar Escreventes
app.get("/api/usuarios/escreventes", autenticar, async (req, res) => {
    try {
        const escreventes = await usuariosDb.listarUsuariosPorPerfil("escreventes");
        // Also include 'escrevente' in case it's singular
        const singular = await usuariosDb.listarUsuariosPorPerfil("escrevente");
        res.json([...escreventes, ...singular]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao listar escreventes" });
    }
});

// Deletar Usuário
app.delete("/api/usuarios/:id", autenticar, async (req, res) => {
    try {
        await usuariosDb.deletarUsuario(req.params.id);
        res.json({ mensagem: "Usuário deletado com sucesso" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao deletar usuário" });
    }
});

// Alterar Senha do Usuário (por admin)
app.patch("/api/usuarios/:id/senha", autenticar, async (req, res) => {
    try {
        const { novaSenha } = req.body;
        if (!novaSenha || novaSenha.length < 4) {
            return res.status(400).json({ erro: "Senha muito curta" });
        }
        
        // Buscamos o usuário pelo ID para obter o email e então atualizar a senha
        const User = require("./models/Usuario");
        const usuario = await User.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ erro: "Usuário não encontrado" });
        }

        await usuariosDb.atualizarSenha(usuario.email, novaSenha);
        res.json({ mensagem: "Senha atualizada com sucesso" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao atualizar senha" });
    }
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
        const { identificador, senha } = req.body || {};
        if (!identificador || !senha) return res.status(400).json({ erro: "Informe e-mail/CPF e senha" });
        const usuario = await usuariosDb.buscarPorEmailOuCpf(identificador);
        
        if (!usuario) return res.status(401).json({ erro: "Credenciais inválidas" });
        
        // Verifica se a senha antiga não hasheada coincide, ou se bate com o hash
        let senhaCorreta = false;
        if (usuario.senha === senha) {
            senhaCorreta = true; // Fallback temporário para senhas antigas que não foram criptografadas
        } else {
            senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        }
        
        if (!senhaCorreta) return res.status(401).json({ erro: "Credenciais inválidas" });
        
        // Gera o Token JWT
        const token = jwt.sign({ id: usuario._id, email: usuario.email }, JWT_SECRET, { expiresIn: '8h' });
        
        const dadosPublicos = usuario.toJSONPublico ? usuario.toJSONPublico() : usuario;
        res.json({ ...dadosPublicos, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao autenticar" });
    }
});

// Autenticação com Google
app.post("/api/auth/google", authLimiter, async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID || "943014478378-edc20egje94rlrbq4m8fsetmtdm03qlo.apps.googleusercontent.com"
        });
        const payload = ticket.getPayload();
        const email = payload.email;
        const nome = payload.name;
        
        let usuario = await usuariosDb.buscarPorEmailOuCpf(email);
        if (!usuario) {
            // Cria usuário caso não exista, com senha vazia ou gerada e um CPF mock (ou precisará completar depois)
            usuario = await usuariosDb.criarUsuario({ nome, email, cpf: "00000000000", senha: Math.random().toString(36).slice(-8) });
            // O ideal seria que ele precisasse informar o CPF, mas para permitir o login imediato:
        }
        // Gera o Token JWT
        const jwtToken = jwt.sign({ id: usuario._id, email: usuario.email }, JWT_SECRET, { expiresIn: '8h' });
        
        const dadosPublicos = usuario.toJSONPublico ? usuario.toJSONPublico() : usuario;
        res.json({ ...dadosPublicos, token: jwtToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao autenticar com o Google" });
    }
});

// Esqueci a senha
app.post("/api/auth/esqueci-senha", authLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ erro: "Informe o e-mail" });
        const usuario = await usuariosDb.buscarPorEmailOuCpf(email);
        if (!usuario) return res.status(404).json({ erro: "E-mail não encontrado" });

        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        await Recuperacao.create({ email, codigo });

        // Enviar e-mail
        // Tenta usar ethereal.email para testes, ou credenciais reais se existirem
        let transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
            port: process.env.EMAIL_PORT || 587,
            auth: {
                user: process.env.EMAIL_USER || 'johathan.nicolas@ethereal.email',
                pass: process.env.EMAIL_PASS
            }
        });
        
        const info = await transporter.sendMail({
            from: '"SIGACRC" <noreply@sigacrc.com.br>',
            to: email,
            subject: "Código de Recuperação de Senha",
            text: `Seu código de recuperação é: ${codigo}`,
            html: `<p>Seu código de recuperação é: <b>${codigo}</b></p>`
        });
        
        console.log("E-mail enviado: %s", info.messageId);
        console.log("URL de visualização (se ethereal): %s", nodemailer.getTestMessageUrl(info));
        
        res.json({ mensagem: "Código enviado para o e-mail informado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao processar recuperação de senha" });
    }
});

// Redefinir senha
app.post("/api/auth/redefinir-senha", async (req, res) => {
    try {
        const { email, codigo, novaSenha } = req.body;
        if (!email || !codigo || !novaSenha) return res.status(400).json({ erro: "Dados incompletos" });
        
        const recuperacao = await Recuperacao.findOne({ email, codigo });
        if (!recuperacao) {
            return res.status(401).json({ erro: "Código inválido ou expirado" });
        }
        
        await usuariosDb.atualizarSenha(email, novaSenha);
        await Recuperacao.deleteOne({ _id: recuperacao._id });
        
        res.json({ mensagem: "Senha redefinida com sucesso" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao redefinir a senha" });
    }
});

// ====== ROTAS DE ATENDIMENTOS ======
app.get("/api/atendimentos", autenticar, async (req, res) => {
    try {
        let atendimentos = await atendimentosDb.listarAtendimentos();
        res.json(atendimentos);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar atendimentos" });
    }
});

app.post("/api/atendimentos", autenticar, async (req, res) => {
    try {
        const novo = await atendimentosDb.criarAtendimento(req.body);
        res.status(201).json(novo);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao criar atendimento" });
    }
});

app.patch("/api/atendimentos/:id", autenticar, async (req, res) => {
    try {
        const { autor, perfil, texto } = req.body;
        const atualizado = await atendimentosDb.adicionarMensagem(req.params.id, autor, perfil, texto);
        res.json(atualizado);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao adicionar mensagem" });
    }
});

async function iniciar() {
    try {
        try {
            await conectarMongo();
            console.log("Conectado ao MongoDB");
            
            // Seed default official user if not exists
            const adminEmail = "admin@sigacrc.com.br";
            if (!(await usuariosDb.existeUsuario(adminEmail, "00000000000"))) {
                await usuariosDb.criarUsuario({
                    nome: "Oficial",
                    email: adminEmail,
                    cpf: "00000000000",
                    senha: "admin",
                    perfil: "oficial"
                });
                console.log("Usuário oficial padrão criado (admin@sigacrc.com.br / admin).");
            }
        } catch (dbError) {
            console.warn("Aviso: Falha ao conectar ao MongoDB. O servidor vai iniciar, mas as funções que dependem do banco darão erro.");
        }
        
        app.listen(PORT, () => {
            console.log(`SIGACRC rodando em http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Falha ao iniciar o servidor:", error.message);
        process.exit(1);
    }
}

iniciar();