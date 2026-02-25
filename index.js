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
    console.log('✅ MONGODB: Conexión establecida correctamenteeeee');
    console.log('------------------------------------');
  })
  .catch(err => {
    console.error('❌ MONGODB: Error de conexión:', err);
  });

// INICIO DEL SERVIDOR
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
  console.log('Presiona Ctrl+C para detenerlo');
});