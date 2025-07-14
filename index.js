// index.js
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors()); // السماح بالوصول من أي origin (ممكن تحدد origin معين)
app.use(express.json());

app.post('/send-email', async (req, res) => {
  const {
    consultation_id,
    user_email,
    user_name,
    reply_message,
    consultation_type,
    is_follow_up
  } = req.body;

  if (!user_email || !user_name || !reply_message) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,       // Gmail account
      pass: process.env.SMTP_PASS,   // Gmail app password
    },
  });

  const subject = is_follow_up
    ? `متابعة بخصوص استشارتك (${consultation_type})`
    : `رد على استشارتك (${consultation_type})`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>مرحبًا ${user_name}،</h2>
      <p>شكرًا لتواصلك معنا بخصوص <strong>${consultation_type}</strong>.</p>
      <p>${is_follow_up ? "هذا رد متابعة على استشارتك:" : "هذا هو الرد الخاص باستشارتك:"}</p>
      <blockquote style="border-left: 4px solid #ccc; padding-left: 10px; color: #333;">
        ${reply_message}
      </blockquote>
      <p>رقم الاستشارة: <strong>${consultation_id}</strong></p>
      <p>إذا كانت لديك أي استفسارات إضافية، لا تتردد في إرسال استشارة جديدة عبر المنصة.</p>

      <div style="margin-top: 30px; padding: 15px; background-color: #fff3cd; border-left: 6px solid #ffecb5;">
        <strong>تنبيه:</strong> هذا البريد مُرسل من عنوان لا يمكن الرد عليه. أي رسائل يتم إرسالها إلى هذا العنوان لن يتم استلامها أو الرد عليها. لطلب استشارة جديدة، يرجى استخدام المنصة فقط.
      </div>

      <hr />
      <p style="font-size: 0.9em; color: #888;">تم إرسال هذا البريد من النظام تلقائيًا.</p>
    </div>
  `;

  const mailOptions = {
    from: `"خدمة الدعم - منصة الاستشارات"`,
    to: user_email,
    replyTo: 'no-reply@gmail.com',
    subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (err) {
    console.log(env.process.EMAIL)
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
