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

// --- 2. CONEXIÓN FIRESTORE (NATIVA DE GOOGLE) ---
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
}
const db = admin.firestore();
console.log('✅ FIRESTORE: Conectado con éxito desde Google Cloud');

// --- 3. CONFIGURACIÓN DE CORREO (NODEMAILER) ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// --- 4. RUTAS DE AUTENTICACIÓN ---

// A. LOGIN CON GOOGLE (BOTÓN)
app.post('/auth/google', async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { email, given_name, family_name, picture } = payload;

        const userRef = db.collection('users').doc(email);
        const doc = await userRef.get();

        let userData;
        if (!doc.exists) {
            // Si el usuario no existe, lo creamos automáticamente
            userData = {
                firstName: given_name,
                lastName: family_name || '',
                email: email,
                imagen: picture,
                role: 'client',
                fechaRegistro: admin.firestore.FieldValue.serverTimestamp()
            };
            await userRef.set(userData);
            console.log(`🆕 Usuario nuevo creado vía Google: ${email}`);
        } else {
            userData = doc.data();
        }

        res.json({ user: userData });
    } catch (err) {
        console.error("Error Google Auth:", err);
        res.status(500).json({ error: "Google Authentication Failed" });
    }
});

// B. LOGIN MANUAL
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const userRef = db.collection('users').doc(email);
        const doc = await userRef.get();

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

// C. FORGOT PASSWORD
app.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const userRef = db.collection('users').doc(email);
        const doc = await userRef.get();

        if (!doc.exists) return res.status(404).json({ error: "No account found" });
        const user = doc.data();

        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.get('host');
        const resetLink = `${protocol}://${host}/reset-password?email=${email}`;

        const mailOptions = {
            from: `"Exprezzr Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Reset Your CAPI Password',
            html: `
                <div style="background:#000; color:#fff; padding:30px; border:2px solid #f4d03f; text-align:center; font-family:sans-serif;">
                    <h1 style="color:#f4d03f;">PASSWORD RECOVERY</h1>
                    <p>Hello ${user.firstName}, click below to set a new password.</p>
                    <a href="${resetLink}" style="display:inline-block; padding:15px 25px; background:#f4d03f; color:#000; text-decoration:none; font-weight:bold; border-radius:50px;">RESET PASSWORD</a>
                </div>`
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "Recovery email sent!" });
    } catch (err) {
        res.status(500).json({ error: "Failed to send email." });
    }
});

// D. ACTUALIZAR CONTRASEÑA
app.post('/set-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.collection('users').doc(email).update({
            password: hashedPassword
        });
        
        res.json({ message: "Password updated successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Error updating password" });
    }
});

// --- 5. RUTAS DE PÁGINAS ---
app.get('/reset-password', (req, res) => res.sendFile(path.join(__dirname, 'public', 'reset-password.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'public', 'signup.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// --- 6. INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CAPI Server running on port ${PORT}`);
});