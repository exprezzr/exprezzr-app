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
            res.json({ success: true, message: "Bienvenido" });
        } else {
            res.status(401).send("Contraseña incorrecta");
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. GOOGLE LOGIN
app.post('/auth/google', async (req, res) => {
    try {
        const { email, name, photoURL } = req.body;
        const userRef = db.collection('users').doc(email);
        
        // Guardar o actualizar usuario al entrar con Google
        await userRef.set({
            email,
            name,
            photoURL,
            lastLogin: new Date()
        }, { merge: true });

        res.json({ success: true, message: "Google Login exitoso" });
    } catch (error) {
        res.status(500).json({ error: "Error en Google Auth" });
    }
});

// 3. OLVIDÉ MI CONTRASEÑA
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

// PUERTO 8080
const PORT = 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor CAPI listo en puerto ${PORT}`);
});