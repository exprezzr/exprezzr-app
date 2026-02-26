require('dotenv').config(); // <-- AGREGADO: Carga las variables de seguridad de tu archivo .env
const password = process.env.MI_CONTRASENA_SECRETA;
const mailer = require('./email/mailer');
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();

// --- MIDDLEWARE ---
app.use(express.json());

// CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS
app.use(express.static(path.join(__dirname, 'public')));

// REDIRECCIÓN A HTTPS (SEGURIDAD)
app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
        res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
        next();
    }
});

// --- 1. CONFIGURACIÓN DE MONGODB ---
// Ahora toma el enlace seguro directamente de tu archivo .env
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
    pass: process.env.EMAIL_PASS // <-- MODIFICADO: Contraseña oculta y segura
  }
});

// --- 3. RUTAS ---

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/status', (req, res) => {
    res.json({
        estado: "En línea",
        motor: "Exprezzr CAPI Engine",
        soporte: "support@exprezzr.com",
        ubicacion: "Iowa (us-central1)",
        timestamp: new Date().toLocaleString()
    });
});

app.get('/test-email', (req, res) => {
    const mailOptions = {
        from: '"Exprezzr Support" <support@exprezzr.com>',
        to: 'ruffenryan@gmail.com', 
        subject: 'Exprezzr Support Test',
        text: 'Hola Ryan, el sistema de correos para tu app de taxi ya funciona desde la nueva región y con credenciales seguras.'
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ enviado: false, error: error.message });
        }
        res.json({ enviado: true, respuesta: info.response });
    });
});

// --- 4. ARRANQUE DEL SERVIDOR ---
// Ahora tomará el puerto 3000 de tu archivo .env
const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
    console.log('------------------------------------');
    console.log(`🚀 Exprezzr App activa en puerto ${PORT}`);
    console.log('------------------------------------');

// Importamos la función que acabamos de crear
const { enviarBienvenida } = require('./email/mailer');

// Llamada de prueba (puedes poner tu propio correo aquí para probar)
enviarBienvenida('ryanruffen@gmail.com');

});

