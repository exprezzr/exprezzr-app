const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  nombre: { 
    type: String, 
    required: [true, 'El nombre es obligatorio'] 
  },
  email: { 
    type: String, 
    unique: true, 
    required: [true, 'El email es obligatorio'] 
  },
  vehiculo: {
    marca: String,
    placa: { type: String, unique: true }
  },
  disponible: { 
    type: Boolean, 
    default: true 
  },
  fechaRegistro: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Driver', DriverSchema);