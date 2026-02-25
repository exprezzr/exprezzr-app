const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    licencia: { type: String, required: true },
    auto: { type: String, default: 'Tesla Model Y' }, // Tu flota estrella
    estaActivo: { type: Boolean, default: false }
});

module.exports = mongoose.model('Driver', DriverSchema);