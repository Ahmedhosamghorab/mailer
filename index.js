// index.js
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer'); // **إضافة: استيراد multer**
require('dotenv').config();

const app = express();

// **تعديل:** إعداد multer لتخزين الملفات في الذاكرة المؤقتة (RAM)
// هذا أفضل من حفظها على القرص الصلب للخادم المؤقت
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(cors());
// app.use(express.json()); // **ملاحظة:** لم نعد بحاجة لهذا بشكل عام هنا لأن المسار سيعالج FormData

// **تعديل:** استخدام multer.array() لاستقبال الملفات والنص
// 'attachments' هو نفس الاسم الذي استخدمناه في FormData بالواجهة الأمامية
app.post('/send-email', upload.array('attachments'), async (req, res) => {
  // **تعديل:** البيانات النصية الآن موجودة في req.body بفضل multer
  const {
    consultation_id,
    user_email,
    user_name,
    reply_message,
    consultation_type,
    is_follow_up
  } = req.body;

  // **تعديل:** الملفات المرفقة الآن موجودة في req.files
  const files = req.files;

  // **تعديل:** التحقق من وجود نص أو ملفات
  if (!user_email || !user_name || (!reply_message && (!files || files.length === 0))) {
    return res.status(400).json({ message: 'Missing required fields. A reply message or an attachment is required.' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.SMTP_PASS,
    },
  });

  const subject = is_follow_up === 'true' // **تعديل:** قيمة is_follow_up ستكون نصية
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
          <p>${is_follow_up === 'true' ? "هذا رد متابعة على استشارتك:" : "هذا هو الرد الخاص باستشارتك:"}</p>
          <blockquote style="border-left: 4px solid #007BFF; padding-left: 15px; margin: 15px 0; background: #f0f4ff; border-radius: 4px;">
            ${reply_message}
          </blockquote>
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
    // **إضافة: قسم المرفقات**
    attachments: files ? files.map(file => ({
      filename: file.originalname, // اسم الملف الأصلي
      content: file.buffer,        // محتوى الملف (مخزن في الذاكرة)
      contentType: file.mimetype,  // نوع الملف (e.g., 'image/jpeg')
    })) : []
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
