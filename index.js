const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer'); // 👈 لإدارة رفع الملفات
require('dotenv').config();

const app = express();

app.use(cors());

// إعداد multer لحفظ الملفات في الذاكرة (مش على الهارد)
const upload = multer({ storage: multer.memoryStorage() });

app.post('/send-email', upload.array('attachments'), async (req, res) => {
  const {
    consultation_id,
    user_email,
    user_name,
    reply_message,
    consultation_type,
    is_follow_up
  } = req.body;

  if (!user_email || !user_name || (!reply_message && req.files.length === 0)) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.SMTP_PASS,
    },
  });

  const subject = is_follow_up === 'true'
    ? `متابعة بخصوص استشارتك (${consultation_type})`
    : `رد على استشارتك (${consultation_type})`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.8;">
      <h2>مرحبًا ${user_name}،</h2>
      <p>${is_follow_up === 'true' ? "هذا رد متابعة على استشارتك:" : "هذا هو الرد الخاص باستشارتك:"}</p>
      <blockquote>${reply_message}</blockquote>
      <p>رقم الاستشارة: <strong>${consultation_id}</strong></p>
    </div>
  `;

  // 👇 تجهيز المرفقات من multer (files in memory)
  const attachments = req.files.map(file => ({
    filename: file.originalname,
    content: file.buffer
  }));

  const mailOptions = {
    from: `"خدمة الدعم - منصة الاستشارات" <${process.env.EMAIL}>`,
    to: user_email,
    replyTo: 'no-reply@gmail.com',
    subject,
    html: htmlContent,
    attachments, // 👈 إدخال المرفقات هنا
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (err) {
    console.error('Email sending error:', err);
    res.status(500).json({
      message: 'Failed to send email',
      error: err.toString(),
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
