const mongoose = require('mongoose');

const recuperacaoSchema = new mongoose.Schema({
    email: { type: String, required: true },
    codigo: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 900 } // Expira em 15 minutos (900s)
});

module.exports = mongoose.model('Recuperacao', recuperacaoSchema);
