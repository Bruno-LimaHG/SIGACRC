const mongoose = require("mongoose");

const documentoAnexoSchema = new mongoose.Schema(
    {
        id: String,
        rotulo: String,
        nome: String,
        tipo: String,
        dados: String
    },
    { _id: false }
);

const pedidoSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true },
        solicitante: { type: String, default: "Não informado" },
        conjuge: { type: String, default: "Não informado" },
        tipo: { type: String, default: "Não informado" },
        cpf: { type: String, default: "" },
        status: { type: String, default: "Pendente" },
        data: { type: String, default: "" },
        testemunha1: { type: String, default: "" },
        testemunha2: { type: String, default: "" },
        documentos: { type: [mongoose.Schema.Types.Mixed], default: [] },
        documentosAnexos: { type: [documentoAnexoSchema], default: [] },
        dadosCompletos: { type: mongoose.Schema.Types.Mixed, default: {} }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Pedido", pedidoSchema);
