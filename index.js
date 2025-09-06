import express from 'express';
import nodemailer from 'nodemailer';
import multer from 'multer';
import cors from 'cors';

const app = express();

// تكوين CORS للسماح بجميع النطاقات
app.use(cors({
  origin: '*',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// تكوين multer للتعامل مع الملفات المرفقة
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

app.use(express.json());

// معالجة طلبات OPTIONS لـ CORS
app.options('/send-email', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

app.post('/send-email', upload.any(), async (req, res) => {
  try {
    // إضافة رؤوس CORS للاستجابة
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    const {
      consultation_id,
      user_email,
      user_name,
      reply_message,
      consultation_type,
      is_follow_up
    } = req.body;

    if (!user_email || !user_name || (!reply_message && (!req.files || req.files.length === 0))) {
      return res.status(400).json({ 
        message: 'Missing required fields.',
        details: 'يجب إدخال نص الرد أو إرفاق ملف على الأقل'
      });
    }

    if (!process.env.EMAIL || !process.env.SMTP_PASS) {
      return res.status(500).json({ 
        message: 'Server configuration error',
        details: 'توجد مشكلة في إعدادات الخادم'
      });
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
      <div style="font-family: Arial, sans-serif; line-height: 1.8; color: #333;">
        <h2 style="color: #007BFF;">مرحبًا ${user_name}،</h2>
        <p>شكرًا لتواصلك معنا بخصوص <strong>${consultation_type}</strong>.</p>
        <p>${is_follow_up ? "هذا رد متابعة على استشارتك:" : "هذا هو الرد الخاص باستشارتك:"}</p>

        ${reply_message ? `
        <blockquote style="border-left: 4px solid #007BFF; padding-left: 15px; margin: 15px 0;">
          ${reply_message}
        </blockquote>
        ` : '<p>تم إرسال الرد كمرفقات.</p>'}

        ${req.files && req.files.length > 0 ? `
        <p>تم إرفاق ${req.files.length} ملف(ات) مع هذا الرد.</p>
        ` : ''}

        <p>رقم الاستشارة: <strong>${consultation_id}</strong></p>
      </div>
    `;

    const mailOptions = {
      from: `"خدمة الدعم" <${process.env.EMAIL}>`,
      to: user_email,
      replyTo: 'no-reply@gmail.com',
      subject,
      html: htmlContent,
    };

    if (req.files && req.files.length > 0) {
      mailOptions.attachments = req.files.map(file => ({
        filename: file.originalname,
        content: file.buffer,
      }));
    }

    const info = await transporter.sendMail(mailOptions);
    
    res.status(200).json({ 
      message: 'تم إرسال البريد بنجاح!',
      messageId: info.messageId
    });
  } catch (err) {
    console.error('خطأ في إرسال البريد:', err);
    res.status(500).json({
      message: 'فشل إرسال البريد',
      error: err.toString(),
    });
  }
});

export default app;