require('dotenv').config();
const bcrypt = require('bcryptjs'); 
const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
const bcrypt = require('bcryptjs'); 
const cors = require('cors');
const { sendResetEmail } = require('./email/mailer');

const app = express();

// MIDDLEWARE
app.use(express.json());
app.use(cors()); 
app.use(express.static(path.join(__dirname, 'public')));

// --- server.js (Versión para Producción) ---
if (!admin.apps.length) {
    admin.initializeApp({
        // En Cloud Run, esto detecta automáticamente el proyecto capi-app-84c75
        credential: admin.credential.applicationDefault()
    });
}
const db = admin.firestore();
console.log('✅ FIRESTORE: Conectado automáticamente en Cloud Run');

// --- RUTAS DE AUTENTICACIÓN ---

// A. RECUPERAR CONTRASEÑA (ENVÍO DE EMAIL)
app.post('/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const userRef = db.collection('users').doc(email);
        const doc = await userRef.get();

        if (!doc.exists) return res.status(404).json({ error: "Email not found" });

        // ✅ Correcto para producción
        const resetLink = `https://${req.get('host')}/reset-password?email=${encodeURIComponent(email)}`; 
        await sendResetEmail(email, resetLink);

        res.json({ message: "Email de recuperación enviado con éxito." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// C. INICIO DE SESIÓN (LOGIN)
app.post('/auth/login', async (req, res) => {
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

// B. ACTUALIZAR CONTRASEÑA (DESDE EL LINK)
app.post('/auth/set-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.collection('users').doc(email).update({ password: hashedPassword });
        res.json({ message: "Password updated!" });
    } catch (err) { res.status(500).json({ error: "Update failed" }); }
});

// RUTAS PARA SERVIR HTML
app.get('/reset-password', (req, res) => res.sendFile(path.join(__dirname, 'public', 'reset-password.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// LANZAMIENTO EN 8080
const PORT = 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CAPI Server LOCK-DOWN on port ${PORT}`);
    db.listCollections()
        .then(() => console.log('✅ FIRESTORE: Conectado con éxito'))
        .catch(e => console.log('❌ FIRESTORE: Revisa tu gcloud login'));
});
// Para el Login Manual (Cambia /auth/login por /login si es necesario)
app.post('/login', async (req, res) => { 
    // ... tu lógica de login aquí ...
});

// Para el Botón de Google (Cambia /auth/google por /auth/google)
app.post('/auth/google', async (req, res) => {
    // ... tu lógica de Google login aquí ...
});