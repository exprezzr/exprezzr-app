const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Recuerda: App Password de 16 caracteres
    }
});

const sendResetEmail = (email, resetLink) => {
    return transporter.sendMail({
        from: `"CAPI Support" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Reset Your Password - CAPI',
        html: `<p>Click here to reset: <a href="${resetLink}">Reset Now</a></p>`
    });
};

module.exports = { sendResetEmail };
