const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        // Asegúrate de que estos nombres coincidan con tu archivo .env y Cloud Run
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS 
    }
});

const sendResetEmail = (email, resetLink) => {
    return transporter.sendMail({
        from: `"CAPI Support" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Reset Your Password - CAPI',
        html: `
            <div style="font-family: sans-serif; max-width: 400px; margin: auto; border: 1px solid #f4d03f; padding: 20px; border-radius: 10px; background-color: #000; color: #fff; text-align: center;">
                <h2 style="color: #f4d03f;">CAPI Support</h2>
                <p>You requested a password reset. Click the button below to secure your account:</p>
                <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #f4d03f; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold;">RESET PASSWORD</a>
                <p style="font-size: 10px; color: #888; margin-top: 20px;">If you didn't request this, please ignore this message.</p>
            </div>
        `
    });
};


// reusable support email helper
const sendSupportEmail = ({ name, lastName, phone, comment, fromEmail }) => {
    return transporter.sendMail({
        from: `"${name} ${lastName}" <${fromEmail || process.env.SMTP_USER}>`,
        to: 'support@exprezzr.com',
        subject: 'New support request from website',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; background-color: #000; color: #fff; padding: 20px; border-radius: 8px;">
                <h2 style="color: #f4d03f;">Support Request</h2>
                <p><strong>Name:</strong> ${name} ${lastName}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Comment:</strong><br>${comment.replace(/\n/g, '<br>')}</p>
                <p style="font-size: 12px; color: #888; margin-top: 20px;">Sent from website contact form.</p>
            </div>
        `
    });
};

module.exports = { sendResetEmail, sendSupportEmail };