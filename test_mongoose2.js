const mongoose = require('mongoose');
const Pedido = require('./models/Pedido');

async function run() {
    await mongoose.connect('mongodb://localhost:27017/sigacrc', { useNewUrlParser: true, useUnifiedTopology: true });
    
    const pedido = await Pedido.findOneAndUpdate(
        { id: "163" },
        { 
            $set: { documentosAnexos: [] },
        },
        { new: true }
    ).lean();

    console.log(pedido.documentosAnexos);
    process.exit(0);
}
run();
