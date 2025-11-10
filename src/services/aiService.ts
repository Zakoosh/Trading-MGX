// خدمة الذكاء الاصطناعي باستخدام Gemini

interface AIResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  provider?: 'gemini';
}

class AIService {
  private geminiApiKey: string;

  constructor() {
    this.geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  // تحليل السهم باستخدام Gemini
  async analyzeStock(stockData: {
    symbol: string;
    name: string;
    price: number;
    rsi: number;
    macd: number;
    macdSignal: number;
    ema: number;
    adx: number;
  }): Promise<AIResponse> {
    const prompt = `أنت محلل مالي خبير. قم بتحليل السهم التالي وإعطاء توصية:

السهم: ${stockData.symbol} - ${stockData.name}
السعر الحالي: $${stockData.price}

المؤشرات الفنية:
- RSI: ${stockData.rsi.toFixed(2)}
- MACD: ${stockData.macd.toFixed(2)}
- MACD Signal: ${stockData.macdSignal.toFixed(2)}
- EMA (20): ${stockData.ema.toFixed(2)}
- ADX: ${stockData.adx.toFixed(2)}

قدم تحليلاً شاملاً يتضمن:
1. التوصية: شراء/بيع/احتفاظ
2. قوة الإشارة: قوية/متوسطة/ضعيفة
3. السعر المستهدف
4. نقطة وقف الخسارة
5. ملاحظات تحليلية تفصيلية (2-3 جمل)

أجب بصيغة JSON فقط:
{
  "recommendation": "buy/sell/hold",
  "strength": "strong/medium/weak",
  "targetPrice": number,
  "stopLoss": number,
  "notes": "string",
  "confidence": number (0-100)
}`;

    return await this.callGemini(prompt);
  }

  // تقييم الإشارة بعد ساعة
  async evaluateSignal(signalData: {
    symbol: string;
    recommendation: string;
    entryPrice: number;
    currentPrice: number;
    timeElapsed: number;
  }): Promise<AIResponse> {
    const priceChange = ((signalData.currentPrice - signalData.entryPrice) / signalData.entryPrice) * 100;
    
    const prompt = `قيّم دقة الإشارة التالية:

السهم: ${signalData.symbol}
التوصية: ${signalData.recommendation}
سعر الدخول: $${signalData.entryPrice}
السعر الحالي: $${signalData.currentPrice}
التغير: ${priceChange.toFixed(2)}%
الوقت المنقضي: ${signalData.timeElapsed} دقيقة

قيّم الإشارة من حيث:
1. الدقة (0-100)
2. هل كانت صحيحة؟
3. ملاحظات التحسين

أجب بصيغة JSON:
{
  "accuracy": number (0-100),
  "isCorrect": boolean,
  "grade": "excellent/good/fair/poor",
  "improvementNotes": "string"
}`;

    return await this.callGemini(prompt);
  }

  // اقتراحات التحسين
  async suggestImprovements(historicalData: {
    totalSignals: number;
    correctSignals: number;
    avgAccuracy: number;
    commonMistakes: string[];
  }): Promise<AIResponse> {
    const successRate = (historicalData.correctSignals / historicalData.totalSignals) * 100;

    const prompt = `بناءً على البيانات التاريخية التالية، اقترح تحسينات للنظام:

إجمالي الإشارات: ${historicalData.totalSignals}
الإشارات الصحيحة: ${historicalData.correctSignals}
معدل النجاح: ${successRate.toFixed(2)}%
متوسط الدقة: ${historicalData.avgAccuracy.toFixed(2)}%

الأخطاء الشائعة:
${historicalData.commonMistakes.map((m, i) => `${i + 1}. ${m}`).join('\n')}

قدم:
1. 3-5 توصيات لتحسين دقة التحليل
2. معايير جديدة مقترحة للمؤشرات الفنية
3. استراتيجيات لتقليل الأخطاء

أجب بصيغة JSON:
{
  "recommendations": ["string"],
  "suggestedCriteria": {
    "rsi": {"buy": number, "sell": number},
    "macd": "string",
    "adx": number
  },
  "strategies": ["string"]
}`;

    return await this.callGemini(prompt);
  }

  // استدعاء Gemini API (استخدام gemini-2.5-flash-lite)
  private async callGemini(prompt: string): Promise<AIResponse> {
    if (!this.geminiApiKey) {
      return { 
        success: false, 
        error: 'Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file' 
      };
    }

    try {
      // استخدام gemini-2.5-flash-lite (النموذج الأحدث والأسرع)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_NONE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_NONE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_NONE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_NONE"
              }
            ]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      // استخراج JSON من الرد
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          data: parsedData,
          provider: 'gemini'
        };
      }

      return {
        success: false,
        error: 'Failed to parse Gemini response - no valid JSON found'
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Gemini API error'
      };
    }
  }

  // اختبار الاتصال
  async testConnection(): Promise<{ gemini: boolean; error?: string }> {
    const testPrompt = 'أجب بـ JSON: {"status": "ok", "message": "Connection successful"}';
    
    const geminiResult = await this.callGemini(testPrompt);

    return {
      gemini: geminiResult.success,
      error: geminiResult.error
    };
  }
}

export const aiService = new AIService();