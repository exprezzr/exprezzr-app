require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');
const { enviarBienvenida } = require('./email/mailer');

const app = express();

// --- MIDDLEWARE ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// REDIRECCIÓN A HTTPS (Solo en producción)
app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
        res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
        next();
    }
});

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

// --- 2. CONFIGURACIÓN DE NODEMAILER (Variables desde .env) ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS  
  }
});

// VERIFICACIÓN DE CONEXIÓN DE EMAIL
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ EMAIL: Error de configuración:', error);
  } else {
    console.log('✅ EMAIL: Servidor listo para enviar correos');
  }
});

// --- 3. RUTAS ---

// Ruta Principal (Carga tu carrusel de 9 autos)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Estado del Servidor
app.get('/status', (req, res) => {
    res.json({
        estado: "En línea",
        motor: "Exprezzr CAPI Engine",
        soporte: process.env.EMAIL_USER,
        timestamp: new Date().toLocaleString()
    });
});

// Ruta de prueba de Email
app.get('/test-email', (req, res) => {
    const mailOptions = {
        from: `"Exprezzr Support" <${process.env.EMAIL_USER}>`,
        to: 'ruffenryan@gmail.com', 
        subject: 'Exprezzr Support Test',
        text: 'Hola Ryan, el sistema ya usa EMAIL_USER y EMAIL_PASS desde el .env'
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
    console.log('------------------------------------');
    console.log(`🚀 Exprezzr App activa en puerto ${PORT}`);
    console.log('------------------------------------');

    // Prueba automática al arrancar
    if (process.env.EMAIL_USER) {
        enviarBienvenida(process.env.EMAIL_USER);
    }
});