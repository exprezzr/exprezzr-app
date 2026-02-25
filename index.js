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

// Usa el puerto que Google Cloud le asigne, o el 8080 por defecto
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Servidor de taxi corriendo en el puerto ${PORT}`);
});