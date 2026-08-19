const mongoose = require('mongoose');
const pedidosDb = require('./db/pedidos');
const Pedido = require('./models/Pedido');

async function run() {
    await mongoose.connect('mongodb://localhost:27017/sigacrc', { useNewUrlParser: true, useUnifiedTopology: true });
    
    // update status and observacao
    const updated = await pedidosDb.atualizarStatusPedido('001', 'Em análise', 'Teste de observação');
    console.log("Updated:", updated);
    
    // fetch
    const fetched = await pedidosDb.buscarPedidoPorId('001');
    console.log("Fetched:", fetched.observacaoEscrevente);
    
    process.exit(0);
}
run().catch(console.error);
