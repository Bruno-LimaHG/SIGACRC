const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker/locale/pt_BR');

// Ajuste o caminho se o seu arquivo de conexão ou modelo estiver noutra pasta
const Pedido = require('../models/Pedido'); 

async function popularBanco() {
    try {
        // Conecta diretamente ao seu MongoDB local da AWS
        await mongoose.connect('mongodb://127.0.0.1:27017/sigacrc');
        console.log("Conectado ao MongoDB. Iniciando a geração de dados...");

        const tipos = ["Casamento Civil", "Casamento Religioso", "Diligência / Salão"];
        const statusList = ["Pendente", "Aprovado", "Recusado"];
        const cepsOsasco = ["06010000", "06020000", "06090000"]; // Ceps base da região

        const novosPedidos = [];
        
        // Vamos gerar do ID 030 até o 150
        for (let i = 30; i <= 150; i++) {
            novosPedidos.push({
                id: String(i).padStart(3, '0'),
                solicitante: faker.person.fullName(),
                conjuge: faker.person.fullName(),
                tipo: faker.helpers.arrayElement(tipos),
                cpf: faker.string.numeric(11),
                status: faker.helpers.arrayElement(statusList),
                // Gera datas de casamento distribuídas no último e no próximo ano
                data: faker.date.between({ from: '2025-01-01', to: '2027-12-31' }).toLocaleDateString('pt-BR'),
                testemunha1: faker.person.fullName(),
                testemunha2: faker.person.fullName(),
                // Insere dados complementares dinâmicos simulando o frontend
                dadosCompletos: {
                    cep: faker.helpers.arrayElement(cepsOsasco),
                    telefone: faker.phone.number()
                }
            });
        }

        // Usa o Mongoose para validar e inserir tudo de uma vez
        await Pedido.insertMany(novosPedidos);
        
        console.log(`Sucesso absoluto! ${novosPedidos.length} pedidos foram injetados na base de dados.`);
        process.exit(0);

    } catch (error) {
        console.error("Erro durante a injeção de dados:", error);
        process.exit(1);
    }
}

popularBanco();
