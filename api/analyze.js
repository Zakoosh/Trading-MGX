// Vercel Serverless Function for Stock Analysis
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
    const { symbols, analysisType = 'technical' } = req.body;

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ error: 'Invalid symbols array' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `أنت محلل مالي خبير. قم بتحليل الأسهم التالية وتقديم توصيات:

الأسهم: ${symbols.join(', ')}

قدم لكل سهم:
1. التوصية (شراء/بيع/انتظار)
2. مستوى الثقة (0-100)
3. السعر المستهدف
4. نقاط الدخول والخروج
5. أسباب التوصية

قدم الرد بصيغة JSON:
{
  "signals": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "recommendation": "buy",
      "confidence": 85,
      "price": 150.00,
      "targetPrice": 165.00,
      "stopLoss": 145.00,
      "reasoning": "..."
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      analysis
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}