const https = require('https');

const botToken = '8382222457:AAGN8IEwtE_l_FPfhAJ4S7yq2NH2lkvV_qw';
const chatId = '6980352639';

const message = '🎉 رسالة تجريبية من نظام Investing2\n\n✅ تم الاتصال بنجاح!\n\n📊 معلومات النظام:\n• الحالة: نشط ✓\n• التاريخ: ' + new Date().toLocaleString('ar-SA') + '\n• المنصة: MetaGPT X\n\n🔔 الإشعارات المفعلة:\n• تقارير كل ساعة ⏰\n• تنبيهات الإشارات القوية 📈\n• تحديثات المحفظة 💼\n\n━━━━━━━━━━━━━━━━━━\nمرحباً بك في منظومة التداول الذكية!';

const data = JSON.stringify({
  chat_id: chatId,
  text: message
});

const options = {
  hostname: 'api.telegram.org',
  path: `/bot${botToken}/sendMessage`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  res.on('end', () => {
    const response = JSON.parse(responseData);
    if (response.ok) {
      console.log('✅ تم إرسال الرسالة بنجاح إلى Telegram!');
      console.log('Message ID:', response.result.message_id);
    } else {
      console.log('❌ فشل الإرسال:', response.description);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ خطأ في الاتصال:', error.message);
});

req.write(data);
req.end();