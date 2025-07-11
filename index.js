// index.js
const express = require('express');
const nodemailer = require('nodemailer');
const app = express();
app.use(express.json()); 
app.post('/send-email', async (req, res) => {
  const { to, subject, text } = req.body;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL, 
      pass: process.env.SMTP_PASS,    
    },
  });
  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to,
    subject,
    text,
  };
  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send email', error: err.toString() });
  }
});

// شغل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
