/**
 * Migra dados antigos de data/*.json para o MongoDB.
 * Execute uma vez: npm run migrar
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const fs = require("fs");
const path = require("path");
const { conectarMongo } = require("../db/connect");
const Pedido = require("../models/Pedido");
const Usuario = require("../models/Usuario");

const DATA_DIR = path.join(__dirname, "..", "data");

function lerJson(arquivo) {
    try {
        return JSON.parse(fs.readFileSync(arquivo, "utf8"));
    } catch {
        return [];
    }
}

async function migrar() {
    await conectarMongo();

    const pedidos = lerJson(path.join(DATA_DIR, "pedidos.json"));
    const usuarios = lerJson(path.join(DATA_DIR, "usuarios.json"));

    let pedidosInseridos = 0;
    let usuariosInseridos = 0;

    for (const pedido of pedidos) {
        const existe = await Pedido.findOne({ id: pedido.id });
        if (!existe) {
            await Pedido.create(pedido);
            pedidosInseridos++;
        }
    }

    for (const usuario of usuarios) {
        const email = (usuario.email || "").toLowerCase();
        const existe = await Usuario.findOne({ email });
        if (!existe) {
            await Usuario.create({
                nome: usuario.nome,
                email,
                cpf: usuario.cpf,
                senha: usuario.senha
            });
            usuariosInseridos++;
        }
    }

    console.log(`Migração concluída: ${pedidosInseridos} pedido(s), ${usuariosInseridos} usuário(s).`);
    process.exit(0);
}

migrar().catch((erro) => {
    console.error("Erro na migração:", erro.message);
    process.exit(1);
});
