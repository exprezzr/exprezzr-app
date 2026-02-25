const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 3000;

// Middleware para entender JSON (importante para recibir datos de la app)
app.use(express.json());

// CONFIGURACIÓN DE MONGODB
// Cambia 'taxi_app_db' por el nombre que quieras para tu base de datos
const mongoURI = 'mongodb://localhost:27017/taxi_app_db';

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Conectado a MongoDB: taxi_app_db'))
  .catch(err => console.error('❌ Error de conexión:', err));

// RUTA DE PRUEBA
app.get('/', (req, res) => {
  res.send('🚕 TAXI-APP-NODE: Servidor en línea');
});

// INICIAR SERVIDOR
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});