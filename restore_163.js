const mongoose = require('mongoose');
const Pedido = require('./models/Pedido');

async function run() {
    await mongoose.connect('mongodb://localhost:27017/sigacrc', { useNewUrlParser: true, useUnifiedTopology: true });
    
    const pedido = await Pedido.findOne({ id: "163" });
    if (!pedido) return;

    pedido.documentosAnexos = [
  {
    "id": "arquivo_certidoes",
    "rotulo": "Documento: certidoes",
    "nome": "Captura de tela 2025-07-22 151427.png",
    "tipo": "image/png",
    "dados": "https://sigacrc-storage.s3.us-east-1.amazonaws.com/documentos/7eec7090d371ad906d0dad8a4a6fd4d5-Captura_de_tela_2025-07-22_151427_png.png"
  },
  {
    "id": "arquivo_rg_noivos",
    "rotulo": "Documento: rg_noivos",
    "nome": "Captura de tela 2025-08-06 163853.png",
    "tipo": "image/png",
    "dados": "https://sigacrc-storage.s3.us-east-1.amazonaws.com/documentos/6ab828651aef7e49557f307e5b17796b-Captura_de_tela_2025-08-06_163853_png.png"
  },
  {
    "id": "arquivo_rg_testemunhas",
    "rotulo": "Documento: rg_testemunhas",
    "nome": "Captura de tela 2025-08-06 151121.png",
    "tipo": "image/png",
    "dados": "https://sigacrc-storage.s3.us-east-1.amazonaws.com/documentos/d4f539f5a9b973c7b9d61cf468f6757c-Captura_de_tela_2025-08-06_151121_png.png"
  },
  {
    "id": "arquivo_residencia",
    "rotulo": "Documento: residencia",
    "nome": "Captura de tela 2025-08-06 164233.png",
    "tipo": "image/png",
    "dados": "https://sigacrc-storage.s3.us-east-1.amazonaws.com/documentos/2960084fc9fb7de81d4872938191f93c-Captura_de_tela_2025-08-06_164233_png.png"
  },
  {
    "id": "arquivo_pacto",
    "rotulo": "Documento: pacto",
    "nome": "Captura de tela 2025-08-26 134437.png",
    "tipo": "image/png",
    "dados": "https://sigacrc-storage.s3.us-east-1.amazonaws.com/documentos/65ac53ea139ade23222ec0e93a8c26a9-Captura_de_tela_2025-08-26_134437_png.png"
  },
  {
    "id": "arquivo_religioso",
    "rotulo": "Documento: religioso",
    "nome": "Captura de tela 2025-08-05 154339.png",
    "tipo": "image/png",
    "dados": "https://sigacrc-storage.s3.us-east-1.amazonaws.com/documentos/bb40af4b2a8ac5fd0500829d1efdc8c6-Captura_de_tela_2025-08-05_154339_png.png"
  }
];
    
    await pedido.save();
    console.log("Restored 163 documents");
    process.exit(0);
}
run();
