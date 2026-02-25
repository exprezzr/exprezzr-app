const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  vehiculo: { type: String, required: true },
  placa: { type: String, unique: true, required: true },
  disponible: { type: Boolean, default: true },
  ubicacion: {
    lat: Number,
    lng: Number
  }
});

module.exports = mongoose.model('Driver', DriverSchema);