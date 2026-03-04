require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
const bcrypt = require('bcryptjs'); // ✅ SOLO UNA VEZ AQUÍ
const nodemailer = require('nodemailer');
const cors = require('cors');
const QRCode = require('qrcode');
const { sendResetEmail } = require('./email/mailer'); // sendSupportEmail se manejará aquí directamente

const app = express();

// MIDDLEWARE
app.use(express.json());
app.use(cors()); 
app.use(express.static(path.join(__dirname, 'public')));

// REDIRECCIÓN A HTTPS (SEGURIDAD)
app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
        res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
        next();
    }
});

// INITIALIZE FIREBASE
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
}
const db = admin.firestore();

// --- RUTAS DE AUTENTICACIÓN ---

// 1. LOGIN (Acepta tanto /login como /auth/login)
app.post(['/login', '/auth/login'], async (req, res) => {
    try {
        const { email, password } = req.body;
        const userRef = db.collection('users').doc(email);
        const doc = await userRef.get();

        if (!doc.exists) return res.status(404).json({ error: "Usuario no encontrado" });

        const user = doc.data();
        const match = await bcrypt.compare(password, user.password);

        if (match) {
            // remove password hash before sending back
            const safeUser = { ...user };
            delete safeUser.password;
            res.json({ success: true, message: "Bienvenido", user: safeUser });
        } else {
            res.status(401).json({ error: "Contraseña incorrecta" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. GOOGLE LOGIN
//    Now the endpoint accepts an ID token from the client, verifies
//    it using Google's OAuth2 client, then creates/updates the user
//    document and returns the user object along with a flag indicating
//    if the account was new.  This matches what the front‑end code expects.
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '139793933381-76aoe2ct7h3e317qj6dvoh9iotb8tb4t.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

app.post('/auth/google', async (req, res) => {
    try {
        const { token } = req.body; // JWT credential from GSI
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        const userRef = db.collection('users').doc(email);
        const doc = await userRef.get();
        const isNew = !doc.exists;

        const userData = {
            email,
            firstName: name.split(' ')[0] || '',
            lastName: name.split(' ').slice(1).join(' ') || '',
            photoURL: picture,
            lastLogin: new Date()
        };
        await userRef.set(userData, { merge: true });

        // respond with the user info (without any sensitive data)
        res.json({ success: true, user: userData, isNewUser: isNew });
    } catch (error) {
        console.error('Google auth error', error);
        res.status(500).json({ error: "Error en Google Auth" });
    }
});

// 3. REGISTRO MANUAL
app.post('/auth/register', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password } = req.body;
        const userRef = db.collection('users').doc(email);
        const doc = await userRef.get();
        if (doc.exists) {
            return res.status(400).json({ error: 'Usuario ya existe' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const newUser = {
            firstName,
            lastName,
            email,
            phone,
            password: hashed,
            createdAt: new Date()
        };
        await userRef.set(newUser);
        const safeUser = { ...newUser };
        delete safeUser.password;
        res.json({ success: true, user: safeUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// helper route used by signup page when a Google user adds a phone number
app.post('/auth/update-phone', async (req, res) => {
    try {
        const { email, phone } = req.body;
        await db.collection('users').doc(email).update({ phone });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. OLVIDÉ MI CONTRASEÑA
app.post('/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const userRef = db.collection('users').doc(email);
        const doc = await userRef.get();
        if (!doc.exists) return res.status(404).json({ error: "Email no encontrado" });

        const resetLink = `https://${req.get('host')}/reset-password?email=${encodeURIComponent(email)}`; 
        await sendResetEmail(email, resetLink);
        res.json({ message: "Email enviado." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. ESTABLECER NUEVA CONTRASEÑA
app.post('/auth/set-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.collection('users').doc(email).update({ password: hashedPassword });
        res.json({ message: "¡Contraseña actualizada!" });
    } catch (err) { res.status(500).json({ error: "Error al actualizar" }); }
});

// --- CONFIGURACIÓN DE CORREOS (TRANSPORTERS) ---

// 1. SOPORTE (usa las credenciales de support@exprezzr.com)
const supportTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SUPPORT_EMAIL_USER,
        pass: process.env.SUPPORT_EMAIL_PASS
    }
});

// 2. RESERVAS (usa las credenciales de job@exprezzr.com)
const jobTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.JOB_EMAIL_USER,
        pass: process.env.JOB_EMAIL_PASS
    }
});

if (!process.env.SUPPORT_EMAIL_PASS || !process.env.JOB_EMAIL_PASS) {
    console.warn("⚠️  ADVERTENCIA: Faltan contraseñas de correo en .env (SUPPORT_EMAIL_PASS o JOB_EMAIL_PASS).");
}

// SUPPORT FORM HANDLER
app.post('/support', async (req, res) => {
    try {
        const { name, lastName, phone, comment, email } = req.body;

        const mailOptions = {
            from: `"CAPI Support" <${process.env.SUPPORT_EMAIL_USER}>`,
            to: process.env.SUPPORT_EMAIL_USER, // Se envía a la bandeja de soporte
            replyTo: email, // Permite responder directamente al cliente
            subject: `New Support Message: ${name} ${lastName}`,
            html: `<p><strong>Name:</strong> ${name} ${lastName}</p><p><strong>Phone:</strong> ${phone}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong><br>${comment}</p>`
        };

        await supportTransporter.sendMail(mailOptions);
        res.json({ message: 'Message sent' });
    } catch (err) {
        console.error('Support email error', err);
        res.status(500).json({ error: 'Could not send support message. ' + err.message });
    }
});

// --- RUTA PARA RESERVAR VIAJE (ENVÍA EMAIL A JOB@EXPREZZR.COM) ---
app.post('/api/book-ride', async (req, res) => {
    try {
        const { origin, destination, price, type, time, user } = req.body;
        
        const mailOptions = {
            from: `"CAPI Booking System" <${process.env.JOB_EMAIL_USER}>`,
            to: process.env.JOB_EMAIL_DESTINATION || 'job@exprezzr.com', 
            subject: `NEW RIDE REQUEST: ${type} - ${user.email || 'Guest'}`,
            html: `
                <h2>New Ride Request</h2>
                <p><strong>Type:</strong> ${type}</p>
                <p><strong>Customer:</strong> ${user.firstName || 'Guest'} ${user.lastName || ''}</p>
                <p><strong>Email:</strong> ${user.email || 'No email'}</p>
                <p><strong>Phone:</strong> ${user.phone || 'Not provided'}</p>
                <p><strong>Pickup:</strong> ${origin}</p>
                <p><strong>Dropoff:</strong> ${destination}</p>
                <p><strong>Estimated Price:</strong> ${price}</p>
                <p><strong>Scheduled Time:</strong> ${time || 'ASAP'}</p>
            `
        };

        await jobTransporter.sendMail(mailOptions);
        res.json({ success: true, message: "Booking email sent" });
    } catch (error) {
        console.error("Error sending booking email:", error);
        res.status(500).json({ error: "Could not send booking email" });
    }
});

// SERVIR ARCHIVOS HTML
app.get('/reset-password', (req, res) => res.sendFile(path.join(__dirname, 'public', 'reset-password.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'public', 'signup.html')));
app.get('/services', (req, res) => res.sendFile(path.join(__dirname, 'public', 'services.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'public', 'about.html')));
app.get('/card', (req, res) => res.sendFile(path.join(__dirname, 'public', 'card.html')));

app.get('/qr-contact', async (req, res) => {
    try {
        // Genera la URL dinámicamente basada en el host actual (localhost o dominio)
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const url = `${protocol}://${req.get('host')}/card`;

        // Genera el QR con los colores de tu marca
        const qrImage = await QRCode.toDataURL(url, {
            color: {
                dark: '#f4d03f',  // Dorado
                light: '#000000'  // Negro
            }
        });
        res.send(`<body style="background:#000; display:flex; justify-content:center; align-items:center; height:100vh;">
                    <img src="${qrImage}" style="border:2px solid #f4d03f; width:300px;">
                  </body>`);
    } catch (err) {
        res.status(500).send("Error al generar el QR");
    }
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

// PUERTO
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor CAPI listo en puerto ${PORT}`);
});