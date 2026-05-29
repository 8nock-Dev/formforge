const nodemailer = require('nodemailer');

let _transporter = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return _transporter;
}

async function sendEmail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[Email disabled] ${subject} → ${to}`);
    return;
  }
  return t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to, subject, html,
  });
}

module.exports = { sendEmail };
