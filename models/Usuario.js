const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    direccion: { type: String, required: true },
    fechaRegistro: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Usuario', usuarioSchema);