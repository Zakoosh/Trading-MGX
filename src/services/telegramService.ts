// خدمة إرسال إشعارات Telegram

interface TelegramConfig {
  botToken: string;
  chatId: string;
}

interface AnalysisResult {
  symbol: string;
  name: string;
  price: number;
  recommendation: string;
  confidence: number;
  strength: string;
}

class TelegramService {
  private config: TelegramConfig;

  constructor() {
    this.config = {
      botToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '',
      chatId: import.meta.env.VITE_TELEGRAM_CHAT_ID || ''
    };
  }

  // إرسال رسالة نصية إلى Telegram
  async sendMessage(message: string): Promise<boolean> {
    if (!this.config.botToken || !this.config.chatId) {
      console.error('Telegram configuration is missing');
      return false;
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.config.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: this.config.chatId,
            text: message,
            parse_mode: 'HTML'
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      return false;
    }
  }

  // إنشاء تقرير التحليل اليومي
  generateDailyReport(results: AnalysisResult[]): string {
    const now = new Date();
    const date = now.toLocaleDateString('ar-SA');
    const time = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    // تصنيف النتائج
    const buySignals = results.filter(r => r.recommendation === 'buy');
    const sellSignals = results.filter(r => r.recommendation === 'sell');
    const holdSignals = results.filter(r => r.recommendation === 'hold');

    // حساب متوسط الثقة
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    // إيجاد أقوى توصية
    const strongestSignal = results.reduce((max, r) => 
      r.confidence > max.confidence ? r : max
    , results[0]);

    // تحديد الاتجاه العام
    let marketTrend = '🟣 محايد';
    if (buySignals.length > sellSignals.length && buySignals.length > holdSignals.length) {
      marketTrend = '🟢 إيجابي (ميل للشراء)';
    } else if (sellSignals.length > buySignals.length && sellSignals.length > holdSignals.length) {
      marketTrend = '🔴 سلبي (ميل للبيع)';
    }

    // بناء الرسالة
    let message = `📊 <b>تقرير التحليل العام (${date})</b>\n\n`;

    // إضافة تفاصيل كل سهم
    results.forEach(result => {
      const emoji = this.getSymbolEmoji(result.symbol);
      const signalEmoji = this.getSignalEmoji(result.recommendation);
      const signalText = this.getSignalText(result.recommendation);

      message += `${emoji} <b>${result.symbol}</b>  💰 $${result.price.toFixed(2)}\n`;
      message += `┣ الإشارة: ${signalText} ${signalEmoji}\n`;
      message += `┣ الثقة: ${result.confidence}%\n`;
      message += `┗━━━━━━━━━━━━━━━\n`;
    });

    // إضافة الملخص
    message += `\n━━━━━━━━━━━━━━━\n`;
    message += `📈 <b>ملخص السوق اليوم:</b>\n`;
    message += `📉 الاتجاه العام: ${marketTrend}\n`;
    message += `🟢 شراء: ${buySignals.length} | 🔴 بيع: ${sellSignals.length} | 🟣 احتفاظ: ${holdSignals.length}\n\n`;
    
    message += `📊 متوسط ثقة السوق: ${avgConfidence.toFixed(1)}%\n`;
    message += this.getConfidenceBar(avgConfidence) + '\n\n';

    // إضافة أقوى توصية
    if (strongestSignal) {
      const strongestEmoji = this.getSignalEmoji(strongestSignal.recommendation);
      const strongestText = this.getSignalText(strongestSignal.recommendation);
      message += `💥 <b>أقوى توصية اليوم:</b> ${strongestSignal.symbol} → ${strongestText} ${strongestEmoji} (${strongestSignal.confidence}%)\n`;
    }

    // رسالة تحذيرية إذا لم توجد إشارات شراء قوية
    if (buySignals.filter(s => s.confidence >= 70).length === 0) {
      message += `⚪ لا توجد إشارة شراء قوية اليوم.\n`;
    }

    message += `✅ عدد الأسهم: ${results.length}\n`;
    message += `📅 التاريخ: ${date}\n`;
    message += `🕐 الوقت: ${time}`;

    return message;
  }

  // الحصول على emoji للرمز
  private getSymbolEmoji(symbol: string): string {
    if (symbol.includes('BTC') || symbol.includes('ETH')) return '🔵';
    if (symbol.includes('XAU') || symbol.includes('GOLD')) return '🟡';
    if (symbol.endsWith('.IS')) return '🇹🇷';
    return '🔴';
  }

  // الحصول على emoji للإشارة
  private getSignalEmoji(recommendation: string): string {
    switch (recommendation.toLowerCase()) {
      case 'buy': return '🟢';
      case 'sell': return '🔴';
      case 'hold': return '⚪';
      default: return '⚪';
    }
  }

  // الحصول على نص الإشارة
  private getSignalText(recommendation: string): string {
    switch (recommendation.toLowerCase()) {
      case 'buy': return 'شراء';
      case 'sell': return 'بيع';
      case 'hold': return 'احتفاظ';
      default: return 'احتفاظ';
    }
  }

  // إنشاء شريط الثقة
  private getConfidenceBar(confidence: number): string {
    const filled = Math.round(confidence / 10);
    const empty = 10 - filled;
    return '🔵 ' + '█'.repeat(filled) + '░'.repeat(empty);
  }

  // إرسال تقرير التحليل اليومي
  async sendDailyReport(results: AnalysisResult[]): Promise<boolean> {
    const report = this.generateDailyReport(results);
    return await this.sendMessage(report);
  }

  // اختبار الاتصال
  async testConnection(): Promise<boolean> {
    return await this.sendMessage('✅ اختبار الاتصال - النظام يعمل بنجاح!');
  }
}

export const telegramService = new TelegramService();