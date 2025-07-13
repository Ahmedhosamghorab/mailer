// index.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
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
      <p>إذا كانت لديك أي استفسارات إضافية، لا تتردد في التواصل معنا.</p>
      <hr />
      <p style="font-size: 0.9em; color: #888;">تم إرسال هذا البريد من النظام تلقائيًا.</p>
    </div>
  `;

  try {
    const response = await axios.post(
      'https://api.mailersend.com/v1/email',
      {
        from: {
          email: process.env.FROM_EMAIL, // no-reply@shor.solutions
          name: 'خدمة الدعم - منصة الاستشارات'
        },
        to: [{ email: user_email, name: user_name }],
        subject: subject,
        html: htmlContent,
        reply_to: [{
          email: 'no-reply@shor.solutions',
          name: 'لا ترد على هذا البريد'
        }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MAILERSEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json({ message: 'Email sent via MailerSend!', id: response.data.message_id });
  } catch (err) {
    console.error('MailerSend error:', err.response?.data || err.message);
    res.status(500).json({
      message: 'Failed to send email via MailerSend',
      error: err.response?.data || err.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
