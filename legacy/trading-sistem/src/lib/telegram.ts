import { AIAnalysis, EvaluationScore } from '../types'
import { formatCurrency, formatPercent } from './utils'

const TELEGRAM_API = 'https://api.telegram.org/bot'

const BOTS = {
  REPORTS: import.meta.env.VITE_TELEGRAM_BOT_REPORTS_TOKEN || 'your_telegram_reports_bot_token',
  STATUS: import.meta.env.VITE_TELEGRAM_BOT_STATUS_TOKEN || 'your_telegram_status_bot_token',
  TRADES: import.meta.env.VITE_TELEGRAM_BOT_TRADES_TOKEN || 'your_telegram_trades_bot_token',
}

const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || 'your_telegram_chat_id'

async function sendMessage(botToken: string, chatId: string, text: string): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })
    const data = await response.json()
    return data.ok === true
  } catch (error) {
    console.error('Telegram send error:', error)
    return false
  }
}

export async function sendTradeNotification(
  symbol: string,
  type: 'BUY' | 'SELL',
  quantity: number,
  price: number,
  total: number,
  tradeType: 'SIMULATOR' | 'REAL',
  analysis?: AIAnalysis
): Promise<boolean> {
  const emoji = type === 'BUY' ? '🟢' : '🔴'
  const typeAr = type === 'BUY' ? 'شراء' : 'بيع'
  const tradeTypeAr = tradeType === 'SIMULATOR' ? '🎮 محاكاة' : '💰 حقيقي'

  const message = `
${emoji} <b>صفقة ${typeAr} جديدة</b>

📊 <b>الرمز:</b> ${symbol}
🔢 <b>الكمية:</b> ${quantity} سهم
💵 <b>السعر:</b> ${formatCurrency(price)}
💰 <b>الإجمالي:</b> ${formatCurrency(total)}
🏷️ <b>نوع التداول:</b> ${tradeTypeAr}
${analysis ? `\n🧠 <b>الثقة بالتحليل:</b> ${analysis.confidence.toFixed(1)}%\n📈 <b>السعر المستهدف:</b> ${formatCurrency(analysis.targetPrice)}\n🛡️ <b>وقف الخسارة:</b> ${formatCurrency(analysis.stopLoss)}` : ''}

⏰ ${new Date().toLocaleString('ar-SA')}
  `.trim()

  return sendMessage(BOTS.TRADES, CHAT_ID, message)
}

export async function sendAnalysisSignal(
  analysis: AIAnalysis,
  score: EvaluationScore
): Promise<boolean> {
  const emoji = analysis.signal === 'BUY' ? '🟢' : analysis.signal === 'SELL' ? '🔴' : '🟡'
  const signalAr = analysis.signal === 'BUY' ? 'شراء' : analysis.signal === 'SELL' ? 'بيع' : 'احتفاظ'

  const message = `
${emoji} <b>إشارة ${signalAr} قوية!</b>

📊 <b>${analysis.name} (${analysis.symbol})</b>
💵 <b>السعر الحالي:</b> ${formatCurrency(analysis.price)}
🎯 <b>السعر المستهدف:</b> ${formatCurrency(analysis.targetPrice)}
🛡️ <b>وقف الخسارة:</b> ${formatCurrency(analysis.stopLoss)}

📈 <b>مؤشرات التحليل:</b>
• RSI: ${analysis.indicators.rsi.toFixed(1)}
• MACD: ${analysis.indicators.macd.toFixed(4)}
• ADX: ${analysis.indicators.adx.toFixed(1)}

⭐ <b>نقاط التقييم:</b> ${score.totalScore.toFixed(0)}/100
🔥 <b>الثقة:</b> ${analysis.confidence.toFixed(1)}%

💬 <b>التحليل:</b>
${analysis.reasoning.substring(0, 200)}...

⏰ ${new Date().toLocaleString('ar-SA')}
  `.trim()

  return sendMessage(BOTS.STATUS, CHAT_ID, message)
}

export async function sendStatusUpdate(
  totalAnalyses: number,
  strongSignals: number,
  sentSignals: number,
  avgScore: number,
  success: boolean,
  error?: string
): Promise<boolean> {
  const statusEmoji = success ? '✅' : '❌'
  const message = `
${statusEmoji} <b>تقرير حالة التحليل التلقائي</b>

📊 <b>إجمالي التحليلات:</b> ${totalAnalyses}
🔥 <b>الإشارات القوية:</b> ${strongSignals}
📤 <b>الإشارات المرسلة:</b> ${sentSignals}
⭐ <b>متوسط الدرجات:</b> ${avgScore.toFixed(1)}/100

${error ? `❌ <b>خطأ:</b> ${error}` : ''}

⏰ ${new Date().toLocaleString('ar-SA')}
  `.trim()

  return sendMessage(BOTS.STATUS, CHAT_ID, message)
}

export async function sendDailyReport(
  portfolioValue: number,
  dailyPnl: number,
  dailyPnlPercent: number,
  topSignals: AIAnalysis[],
  totalTrades: number
): Promise<boolean> {
  const pnlEmoji = dailyPnl >= 0 ? '📈' : '📉'
  const pnlFormatted = formatPercent(dailyPnlPercent)

  const topSignalsText = topSignals.slice(0, 3).map((s, i) => {
    const emoji = s.signal === 'BUY' ? '🟢' : s.signal === 'SELL' ? '🔴' : '🟡'
    return `${i + 1}. ${emoji} ${s.symbol} - ${s.confidence.toFixed(1)}% ثقة`
  }).join('\n')

  const message = `
📊 <b>التقرير اليومي</b>
📅 ${new Date().toLocaleDateString('ar-SA')}

💼 <b>قيمة المحفظة:</b> ${formatCurrency(portfolioValue)}
${pnlEmoji} <b>ربح/خسارة اليوم:</b> ${formatCurrency(dailyPnl)} (${pnlFormatted})
🔄 <b>إجمالي الصفقات:</b> ${totalTrades}

🏆 <b>أفضل الإشارات اليوم:</b>
${topSignalsText || 'لا توجد إشارات'}

⏰ ${new Date().toLocaleString('ar-SA')}
  `.trim()

  return sendMessage(BOTS.REPORTS, CHAT_ID, message)
}

export async function sendSystemAlert(message: string): Promise<boolean> {
  const alertMessage = `
⚠️ <b>تنبيه النظام</b>

${message}

⏰ ${new Date().toLocaleString('ar-SA')}
  `.trim()

  return sendMessage(BOTS.STATUS, CHAT_ID, alertMessage)
}
