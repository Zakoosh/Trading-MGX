const https = require('https');

const botToken = '8382222457:AAGN8IEwtE_l_FPfhAJ4S7yq2NH2lkvV_qw';
const chatId = '6980352639';

const message = `🎉 *رسالة تجريبية من نظام Investing2*

✅ تم الاتصال بنجاح!

📊 *معلومات النظام:*
• الحالة: نشط ✓
• التاريخ: ${new Date().toLocaleString('ar-SA')}
• المنصة: MetaGPT X

🔔 *الإشعارات المفعلة:*
• تقارير كل ساعة ⏰
• تنبيهات الإشارات القوية 📈
• تحديثات المحفظة 💼

━━━━━━━━━━━━━━━━━━
_مرحباً بك في منظومة التداول الذكية!_`;

const data = JSON.stringify({
  chat_id: chatId,
  text: message,
  parse_mode: 'Markdown'
});

const options = {
  hostname: 'api.telegram.org',
  path: `/bot${botToken}/sendMessage`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  res.on('end', () => {
    console.log('✅ تم إرسال الرسالة بنجاح!');
    console.log('Response:', responseData);
  });
});

req.on('error', (error) => {
  console.error('❌ خطأ في الإرسال:', error);
});

req.write(data);
req.end();