const mongoose = require('mongoose');
const Pedido = require('./models/Pedido');

async function run() {
    await mongoose.connect('mongodb://localhost:27017/sigacrc', { useNewUrlParser: true, useUnifiedTopology: true });
    
    const pedido = await Pedido.findOne({ id: "163" });
    if (!pedido) return console.log("Not found");

    // Remove duplicates that don't have an ID
    const origLength = pedido.documentosAnexos.length;
    pedido.documentosAnexos = pedido.documentosAnexos.filter(d => d.id);
    
    // Also, if any have dados = null, we can't recover the S3 URL easily here unless we match it,
    // but the user is going to re-upload anyway, so let's just clear their dados to let them re-upload.
    
    await pedido.save();
    console.log("Fixed. Removed", origLength - pedido.documentosAnexos.length, "corrupted items.");
    process.exit(0);
}
run();
