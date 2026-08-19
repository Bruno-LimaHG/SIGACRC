const mongoose = require('mongoose');
const Pedido = require('./models/Pedido');

async function run() {
    await mongoose.connect('mongodb://localhost:27017/sigacrc', { useNewUrlParser: true, useUnifiedTopology: true });
    
    // fetch
    const p = await Pedido.findOne({ id: '163' }).lean();
    console.log("Pedido 163:", p ? p : "Não encontrado");
    
    process.exit(0);
}
run().catch(console.error);
