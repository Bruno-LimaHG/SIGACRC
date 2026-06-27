const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const usuarioSchema = new mongoose.Schema(
    {
        nome: { type: String, required: true, trim: true },
        email: { 
            type: String, 
            required: true, 
            unique: true, 
            lowercase: true, 
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'E-mail inválido']
        },
        cpf: { 
            type: String, 
            required: true, 
            trim: true,
            match: [/^\d{11}$/, 'CPF deve conter exatamente 11 números']
        },
        senha: { type: String, required: true },
        perfil: { type: String, enum: ['cliente', 'escrevente', 'oficial'], default: 'cliente' }
    },
    { timestamps: true }
);

usuarioSchema.pre('save', async function(next) {
    if (!this.isModified('senha')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.senha = await bcrypt.hash(this.senha, salt);
        next();
    } catch (error) {
        next(error);
    }
});

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
