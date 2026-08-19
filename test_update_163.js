const mongoose = require('mongoose');
const pedidosDb = require('./db/pedidos');

async function run() {
    await mongoose.connect('mongodb://localhost:27017/sigacrc', { useNewUrlParser: true, useUnifiedTopology: true });
    
    // update status and observacao
    const updated = await pedidosDb.atualizarStatusPedido('163', 'Exigência documental', 'Falta certidão de nascimento atualizada.');
    console.log("Updated observacao:", updated.observacaoEscrevente);
    console.log("Updated historico:", updated.historico);
    
    process.exit(0);
}
run().catch(console.error);
