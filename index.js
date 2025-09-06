const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

const app = express();

// تكوين multer للتعامل مع الملفات المرفقة
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // الحد الأقصى لحجم الملف: 5MB
  },
});

app.use(cors());
app.use(express.json());

app.post('/send-email', upload.any(), async (req, res) => {
  try {
    const {
      consultation_id,
      user_email,
      user_name,
      reply_message,
      consultation_type,
      is_follow_up
    } = req.body;

    if (!user_email || !user_name || (!reply_message && (!req.files || req.files.length === 0))) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.SMTP_PASS,
      },
    });

    const subject = is_follow_up
      ? `متابعة بخصوص استشارتك (${consultation_type})`
      : `رد على استشارتك (${consultation_type})`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.8; background-color: #f7f9fc; padding: 20px; color: #333;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          
          <div style="background-color: #007BFF; color: white; padding: 15px 20px;">
            <h2 style="margin: 0; font-size: 1.4em;">📩 منصة الاستشارات</h2>
          </div>

          <div style="padding: 20px;">
            <h2 style="color: #007BFF; margin-top: 0;">مرحبًا ${user_name}،</h2>
            <p>شكرًا لتواصلك معنا بخصوص <strong>${consultation_type}</strong>.</p>
            <p>${is_follow_up ? "هذا رد متابعة على استشارتك:" : "هذا هو الرد الخاص باستشارتك:"}</p>

            ${reply_message ? `
            <blockquote style="border-left: 4px solid #007BFF; padding-left: 15px; margin: 15px 0; background: #f0f4ff; border-radius: 4px;">
              ${reply_message}
            </blockquote>
            ` : ''}

            ${req.files && req.files.length > 0 ? `
            <p style="margin-top: 15px;">تم إرفاق ${req.files.length} ملف(ات) مع هذا الرد.</p>
            ` : ''}

            <p style="margin-top: 15px;">رقم الاستشارة: <strong>${consultation_id}</strong></p>

            <div style="margin-top: 25px; padding: 15px; background-color: #fff3cd; border-left: 6px solid #ffecb5; border-radius: 4px;">
              <strong>⚠️ تنبيه:</strong> هذا البريد مُرسل من عنوان لا يمكن الرد عليه. أي رسائل يتم إرسالها إلى هذا العنوان لن يتم استلامها أو الرد عليها. لطلب استشارة جديدة، يرجى استخدام المنصة فقط.
            </div>
          </div>

          <div style="background: #f1f1f1; padding: 10px; text-align: center; font-size: 0.85em; color: #777;">
            تم إرسال هذا البريد من النظام تلقائيًا.
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"خدمة الدعم - منصة الاستشارات" <${process.env.EMAIL}>`,
      to: user_email,
      replyTo: 'no-reply@gmail.com',
      subject,
      html: htmlContent,
    };

    // إضافة المرفقات إذا وجدت
    if (req.files && req.files.length > 0) {
      mailOptions.attachments = req.files.map(file => ({
        filename: file.originalname,
        content: file.buffer,
      }));
    }

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