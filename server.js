require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
const bcrypt = require('bcryptjs'); // ✅ SOLO UNA VEZ AQUÍ
const cors = require('cors');
const { sendResetEmail } = require('./email/mailer');

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
            audience: process.env.GOOGLE_CLIENT_ID
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

// SERVIR ARCHIVOS HTML
app.get('/reset-password', (req, res) => res.sendFile(path.join(__dirname, 'public', 'reset-password.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// PUERTO
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor CAPI listo en puerto ${PORT}`);
});