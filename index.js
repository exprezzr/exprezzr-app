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

// Ruta de prueba para confirmar que la app de taxi está en el aire
app.get('/status', (req, res) => {
    res.json({
        estado: "En línea",
        mensaje: "El motor de la aplicación de taxi está funcionando",
        ubicacion: "Montreal (Nube)",
        timestamp: new Date().toLocaleString()
    });
});

// IMPORTANTE: Asegúrate de que el puerto sea el 8080 para Cloud Run
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Taxi App escuchando en puerto ${PORT}`);
});