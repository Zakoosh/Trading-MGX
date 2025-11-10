// Vercel Serverless Function for Telegram Notifications

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, type = 'info', signals = [] } = req.body;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return res.status(400).json({ 
        error: 'Telegram credentials not configured',
        message: 'Please set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in environment variables'
      });
    }

    // Format message based on type
    let formattedMessage = '';
    
    if (type === 'daily_report') {
      formattedMessage = formatDailyReport(signals);
    } else if (type === 'signal_alert') {
      formattedMessage = formatSignalAlert(signals[0]);
    } else {
      formattedMessage = message;
    }

    // Send to Telegram
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: formattedMessage,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.description || 'Failed to send Telegram message');
    }

    return res.status(200).json({
      success: true,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Telegram error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

function formatDailyReport(signals) {
  const date = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let message = `📊 <b>التقرير اليومي - ${date}</b>\n\n`;

  if (signals.length === 0) {
    message += '⚠️ لا توجد إشارات جديدة اليوم\n';
    message += 'السوق هادئ، استمر في المراقبة 👀';
    return message;
  }

  const buySignals = signals.filter(s => s.recommendation === 'buy');
  const sellSignals = signals.filter(s => s.recommendation === 'sell');

  message += `✅ إشارات شراء: ${buySignals.length}\n`;
  message += `❌ إشارات بيع: ${sellSignals.length}\n\n`;

  // Top 3 buy signals
  if (buySignals.length > 0) {
    message += '<b>🚀 أفضل فرص الشراء:</b>\n\n';
    buySignals
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
      .forEach((signal, index) => {
        message += `${index + 1}. <b>${signal.symbol}</b> - ${signal.name}\n`;
        message += `   💰 السعر: $${signal.price.toFixed(2)}\n`;
        message += `   🎯 الهدف: $${signal.targetPrice.toFixed(2)}\n`;
        message += `   📊 الثقة: ${signal.confidence}%\n`;
        message += `   📝 ${signal.reasoning.substring(0, 100)}...\n\n`;
      });
  }

  message += '\n🔗 افتح التطبيق لمراجعة جميع التفاصيل';

  return message;
}

function formatSignalAlert(signal) {
  if (!signal) return 'تنبيه جديد';

  const emoji = signal.recommendation === 'buy' ? '🚀' : '⚠️';
  const action = signal.recommendation === 'buy' ? 'شراء' : 'بيع';

  let message = `${emoji} <b>فرصة قوية - ${action.toUpperCase()}</b>\n\n`;
  message += `📈 <b>${signal.symbol}</b> - ${signal.name}\n\n`;
  message += `💰 السعر الحالي: $${signal.price.toFixed(2)}\n`;
  message += `🎯 السعر المستهدف: $${signal.targetPrice.toFixed(2)}\n`;
  message += `🛡️ وقف الخسارة: $${signal.stopLoss.toFixed(2)}\n`;
  message += `📊 مستوى الثقة: ${signal.confidence}%\n\n`;
  message += `📝 <b>التحليل:</b>\n${signal.reasoning}\n\n`;
  
  const potentialGain = ((signal.targetPrice - signal.price) / signal.price * 100).toFixed(2);
  message += `💎 الربح المتوقع: ${potentialGain}%\n\n`;
  message += `⏰ ${new Date().toLocaleString('ar-EG')}`;

  return message;
}