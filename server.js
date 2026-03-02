require('dotenv').config(); 
const express = require('express');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const path = require('path');
const bcrypt = require('bcryptjs'); 
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library'); 

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- 1. MIDDLEWARE ---
app.use(express.json());
app.use(cors()); 
app.use(express.static(path.join(__dirname, 'public')));

// --- 2. CONEXIÓN FIRESTORE ---
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
}
const db = admin.firestore();
console.log('✅ FIRESTORE: Conectado con éxito');

// --- 3. CONFIGURACIÓN DE CORREO ---
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // false para puerto 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // Esto ayuda si hay problemas de certificados en el servidor
  }
});

// --- 4. RUTAS DE AUTENTICACIÓN (API) ---

// A. LOGIN / REGISTRO CON GOOGLE
app.post('/auth/google', async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const { email, given_name, family_name, picture } = ticket.getPayload();

        const userRef = db.collection('users').doc(email);
        const doc = await userRef.get();

        if (!doc.exists) {
            const userData = {
                firstName: given_name,
                lastName: family_name || '',
                email: email,
                imagen: picture,
                role: 'client',
                fechaRegistro: admin.firestore.FieldValue.serverTimestamp()
            };
            await userRef.set(userData);
            return res.json({ isNewUser: true, user: userData });
        } else {
            return res.json({ isNewUser: false, user: doc.data() });
        }
    } catch (err) {
        res.status(500).json({ error: "Google Auth Failed" });
    }
});

// B. REGISTRO MANUAL
app.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password } = req.body;
        const userRef = db.collection('users').doc(email);
        const doc = await userRef.get();

        if (doc.exists) return res.status(400).json({ error: "Email already registered" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            firstName, lastName, email, phone,
            password: hashedPassword,
            role: 'client',
            fechaRegistro: admin.firestore.FieldValue.serverTimestamp()
        };

        await userRef.set(newUser);
        res.status(201).json({ message: "User created", user: { firstName, email } });
    } catch (err) {
        res.status(500).json({ error: "Error creating account" });
    }
});

// C. LOGIN MANUAL
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const doc = await db.collection('users').doc(email).get();

        if (!doc.exists) return res.status(400).json({ error: "User not found" });
        
        const user = doc.data();
        if (!user.password) return res.status(400).json({ error: "Please use Google Login" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// D. ACTUALIZAR TELÉFONO (POST-GOOGLE)
app.post('/update-phone', async (req, res) => {
    try {
        const { email, phone } = req.body;
        await db.collection('users').doc(email).update({ phone });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to update phone" });
    }
});

// E. RECUPERAR / SETEAR CONTRASEÑA
app.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const doc = await db.collection('users').doc(email).get();
        if (!doc.exists) return res.status(404).json({ error: "No account found" });

        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.get('host');
        const resetLink = `${protocol}://${host}/reset-password?email=${email}`;

        await transporter.sendMail({
            from: `"CAPI Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Reset Your Password',
            html: `<div style="text-align:center; border:2px solid #f4d03f; padding:20px; background:#000; color:#fff;">
                   <h2 style="color:#f4d03f;">PASSWORD RESET</h2>
                   <a href="${resetLink}" style="color:#000; background:#f4d03f; padding:10px 20px; text-decoration:none; font-weight:bold;">RESET NOW</a>
                   </div>`
        });
        res.json({ message: "Email sent!" });
    } catch (err) {
        console.error("CRITICAL SMTP ERROR:", err);
        res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
});

app.post('/set-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await db.collection('users').doc(email).update({ password: hashedPassword });
        res.json({ message: "Updated!" });
    } catch (err) { res.status(500).json({ error: "Error" }); }
});

// --- 5. RUTAS DE PÁGINAS (SERVIR HTML) ---
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'public', 'signup.html')));
app.get('/reset-password', (req, res) => res.sendFile(path.join(__dirname, 'public', 'reset-password.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// --- 6. LANZAMIENTO ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CAPI Server running on port ${PORT}`);
});

// server.js
require('dotenv').config();
const express = require('express');
const { sendResetEmail } = require('./email/mailer'); // Importa desde tu carpeta email

// ... (resto de tus configuraciones de Express y Firebase)

app.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        // 1. Verificar si el usuario existe en Firestore
        const doc = await db.collection('users').doc(email).get();
        if (!doc.exists) return res.status(404).json({ error: "No account found" });

        // 2. Construir el link (Cloud Run usa https por defecto)
        const resetLink = `https://${req.get('host')}/reset-password?email=${email}`;

        // 3. Enviar correo usando el módulo externo
        await sendResetEmail(email, resetLink);
        
        res.json({ message: "Email sent successfully!" });
    } catch (err) {
        console.error("DETAILED ERROR IN SERVER.JS:", err); // Esto aparecerá en los logs de Cloud Run
        res.status(500).json({ error: "Server failed to send email." });
    }
});