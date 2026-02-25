const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();

// --- MIDDLEWARE ---
app.use(express.json());
app.use(express.static('public'));

// --- 1. CONFIGURACIÓN DE MONGODB ---
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
    pass: 'U=%N7YVAZ&bH2nK*' 
  }
});

// --- 3. RUTAS ---

app.get('/', (req, res) => {
    res.send('<h1>Exprezzr Taxi App</h1><p>Dominio exprezzr.com configurado correctamente.</p>');
});

app.get('/status', (req, res) => {
    res.json({
        estado: "En línea",
        mensaje: "El motor de la aplicación de taxi está funcionando",
        soporte: "support@exprezzr.com",
        ubicacion: "Iowa (us-central1)", // <--- Actualizado para reflejar tu nueva región gratuita
        timestamp: new Date().toLocaleString()
    });
});

app.get('/test-email', (req, res) => {
    const mailOptions = {
        from: '"Exprezzr Support" <support@exprezzr.com>',
        to: 'ruffenryan@gmail.com', // He actualizado esto con tu correo de contacto
        subject: 'Exprezzr Support Test',
        text: 'Hola Ryan, el sistema de correos para tu app de taxi ya funciona desde la nueva región.'
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ enviado: false, error: error.message });
        }
        res.json({ enviado: true, respuesta: info.response });
    });
});

// --- 4. ARRANQUE DEL SERVIDOR ---
const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`------------------------------------`);
    console.log(`🚀 Exprezzr App activa en puerto ${PORT}`);
    console.log(`------------------------------------`);
});