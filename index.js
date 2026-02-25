const express = require('express');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

// MIDDLEWARE: Para que el servidor pueda leer JSON
app.use(express.json());
// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));

// CONEXIÓN A MONGODB
// taxi_app_db es el nombre de tu base de datos local
const mongoURI = 'mongodb://localhost:27017/taxi_app_db';

mongoose.connect(mongoURI)
  .then(() => {
    console.log('------------------------------------');
    console.log('✅ MONGODB: establecida correctamnte');
    console.log('------------------------------------');
  })
  .catch(err => {
    console.error('❌ MONGODB: Error de conexión:', err);
  });

// Este bloque debe ir al final de index.js
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor en vivo: http://localhost:${PORT}`);
    console.log('👀 Monitoreando cambios en el código...');
});