require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker/locale/pt_BR"); // Usar dados em português brasileiro
const { conectarMongo } = require("../db/connect");
const Pedido = require("../models/Pedido");
const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs");

// Quantidade de registros falsos a serem gerados
const NUM_USUARIOS = 10;
const NUM_PEDIDOS = 20;

function gerarCpf() {
    return faker.string.numeric(11);
}

async function popularBanco() {
    try {
        await conectarMongo();
        console.log("Conectado ao MongoDB. Iniciando população do banco de dados...");

        // 1. Criar Usuários Falsos
        const usuariosCriados = [];
        const senhaPadrao = await bcrypt.hash("123456", 10);

        for (let i = 0; i < NUM_USUARIOS; i++) {
            const nome = faker.person.fullName();
            const email = faker.internet.email({ firstName: nome.split(" ")[0] }).toLowerCase();
            const cpf = gerarCpf();

            const usuario = new Usuario({
                nome,
                email,
                cpf,
                senha: senhaPadrao,
            });

            await usuario.save();
            usuariosCriados.push(usuario);
        }
        console.log(`✅ ${NUM_USUARIOS} usuários falsos criados!`);

        // 2. Criar Pedidos Falsos
        // Vamos pegar qual foi o último ID numérico para continuar a contagem sequencial
        const ultimoPedido = await Pedido.findOne().sort({ createdAt: -1 });
        let proximoIdInt = 1;
        if (ultimoPedido && !isNaN(parseInt(ultimoPedido.id, 10))) {
            proximoIdInt = parseInt(ultimoPedido.id, 10) + 1;
        }

        const tiposDePedido = ["Casamento Civil", "Casamento Religioso", "Diligência / Salão", "Cartório"];
        const statusDePedido = ["Pendente", "Aprovado", "Recusado"];

        for (let i = 0; i < NUM_PEDIDOS; i++) {
            // Atribuir aleatoriamente a um usuário criado ou criar independente
            const usuarioSorteado = faker.helpers.arrayElement(usuariosCriados);
            
            const novoId = String(proximoIdInt).padStart(3, '0');
            proximoIdInt++;

            const dataFormatada = faker.date.future({ years: 1 }).toLocaleDateString("pt-BR");

            const pedido = new Pedido({
                id: novoId,
                solicitante: usuarioSorteado.nome,
                conjuge: faker.person.fullName(),
                tipo: faker.helpers.arrayElement(tiposDePedido),
                cpf: usuarioSorteado.cpf,
                status: faker.helpers.arrayElement(statusDePedido),
                data: dataFormatada,
                testemunha1: faker.person.fullName(),
                testemunha2: faker.person.fullName(),
                documentos: ["RG_Fake.pdf", "CPF_Fake.pdf"],
                documentosAnexos: [],
                dadosCompletos: {}
            });

            await pedido.save();
        }
        console.log(`✅ ${NUM_PEDIDOS} pedidos falsos criados!`);

        console.log("Processo concluído com sucesso!");
        process.exit(0);
    } catch (error) {
        console.error("Erro ao popular o banco:", error);
        process.exit(1);
    }
}

popularBanco();
