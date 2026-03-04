const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path'); // <-- AGREGADO: Necesario para manejar rutas de archivos

const app = express();

// --- MIDDLEWARE ---
app.use(express.json());

// CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS
// Esto permite que el HTML encuentre el logo en 'public/images/logo-exprezzr.png'
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
    pass: 'U=%N7YVAZ&bH2nK*' // Asegúrate que esta sea tu "Contraseña de Aplicación"
  }
});

// --- 3. RUTAS ---

// RUTA PRINCIPAL: Envía el archivo index.html con el diseño premium
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// RUTA DE TARJETA DIGITAL
app.get('/card', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'card.html'));
});

app.get('/download-vcard', (req, res) => {
    const vcard = "BEGIN:VCARD\n" +
                  "VERSION:3.0\n" +
                  "FN:Capi Taxi\n" +
                  "ORG:Exprezzr LLC\n" +
                  "TEL;TYPE=WORK,VOICE:12015512020\n" +
                  "EMAIL:support@exprezzr.com\n" +
                  "URL:https://exprezzr.com\n" +
                  "END:VCARD";

    res.set('Content-Type', 'text/vcard');
    res.set('Content-Disposition', 'attachment; filename="Capi_Taxi.vcf"');
    res.send(vcard);
});

// RUTA DE ESTATUS: Para monitorear la salud del servidor
app.get('/status', (req, res) => {
    res.json({
        estado: "En línea",
        motor: "Exprezzr CAPI Engine",
        soporte: "support@exprezzr.com",
        ubicacion: "Iowa (us-central1)",
        timestamp: new Date().toLocaleString()
    });
});

// RUTA DE PRUEBA DE EMAIL
app.get('/test-email', (req, res) => {
    const mailOptions = {
        from: '"Exprezzr Support" <support@exprezzr.com>',
        to: 'ruffenryan@gmail.com', 
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
    console.log('------------------------------------');
    console.log(`🚀 Exprezzr App activa en puerto ${PORT}`);
    console.log('------------------------------------');
});