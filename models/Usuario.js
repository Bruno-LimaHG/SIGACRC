const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema(
    {
        nome: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        cpf: { type: String, required: true, trim: true },
        senha: { type: String, required: true },
        perfil: { type: String, enum: ['cliente', 'escrevente', 'oficial'], default: 'cliente' }
    },
    { timestamps: true }
);

usuarioSchema.methods.toJSONPublico = function toJSONPublico() {
    return {
        id: this._id.toString(),
        nome: this.nome,
        email: this.email,
        cpf: this.cpf,
        perfil: this.perfil
    };
};

module.exports = mongoose.model("Usuario", usuarioSchema);
