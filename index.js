const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();

// --- MIDDLEWARE ---
// Permite que el servidor entienda datos en formato JSON
app.use(express.json());
// Sirve archivos como imágenes, CSS o HTML desde la carpeta 'public'
app.use(express.static('public'));

// --- 1. CONFIGURACIÓN DE MONGODB ---
// Para Cloud Run, usaremos una variable de entorno si existe, o la local por defecto
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/taxi_app_db';

mongoose.connect(mongoURI)
  .then(() => {
    console.log('------------------------------------');
    console.log('✅ MONGODB: Conexión establecida');
    console.log('------------------------------------');
  })
  .catch(err => {
    console.error('❌ MONGODB: Error de conexión:', err);
  });

// --- 2. CONFIGURACIÓN DE NODEMAILER (SUPPORT EMAIL) ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'support@exprezzr.com',
    pass: 'JNuj5nDXmr5M5uZ=' // Generada en tu cuenta de Google Workspace
  }
});

// --- 3. RUTAS ---

// Ruta principal (Home)
app.get('/', (req, res) => {
    res.send('<h1>Exprezzr Taxi App</h1><p>Dominio exprezzr.com configurado correctamente.</p>');
});

// Ruta de estatus técnica para verificar salud de la app
app.get('/status', (req, res) => {
    res.json({
        estado: "En línea",
        mensaje: "El motor de la aplicación de taxi está funcionando",
        soporte: "support@exprezzr.com",
        ubicacion: "Montreal (Northamerica-northeast1)",
        timestamp: new Date().toLocaleString()
    });
});

// Ruta de prueba para envío de correos
app.get('/test-email', (req, res) => {
    const mailOptions = {
        from: '"Exprezzr Support" <support@exprezzr.com>',
        to: 'tu-correo-personal@gmail.com', // Cambia esto por tu email personal
        subject: 'Exprezzr Support Test',
        text: 'Hola Ryan, el sistema de correos para tu app de taxi ya funciona.'
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ enviado: false, error: error.message });
        }
        res.json({ enviado: true, respuesta: info.response });
    });
});

// Asegura que escuche en 0.0.0.0 para que Google pueda conectar el dominio
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Taxi App live on port ${PORT}`);
});