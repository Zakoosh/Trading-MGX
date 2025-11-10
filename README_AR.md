# 🚀 Investing2 - منظومة التداول الذكية

نظام تداول وتحليل ذكي متكامل باللغة العربية يعتمد على الذكاء الاصطناعي لتحليل الأسهم وتوليد التوصيات.

## 📋 المحتويات

- [نظرة عامة](#نظرة-عامة)
- [المميزات](#المميزات)
- [التقنيات المستخدمة](#التقنيات-المستخدمة)
- [التثبيت والإعداد](#التثبيت-والإعداد)
- [الاستخدام](#الاستخدام)
- [المكونات الأساسية](#المكونات-الأساسية)
- [التكاملات](#التكاملات)
- [الأسئلة الشائعة](#الأسئلة-الشائعة)

## 🎯 نظرة عامة

Investing2 هو نظام تداول ذكي شامل يوفر:
- تحليل فني متقدم للأسهم
- محاكاة واقعية للتداول
- تتبع الأداء وإصدار التقارير
- واجهة عربية احترافية

## ✨ المميزات

### 🧠 محلل السوق الذكي (AI Analyzer)
- تحليل المؤشرات الفنية (RSI, MACD, EMA, ADX)
- توليد إشارات شراء/بيع/احتفاظ
- تقييم قوة الإشارات
- ملاحظات تحليلية تفصيلية

### ⚙️ المقيّم الفني (AI Evaluator)
- تقييم دقة الإشارات
- حساب درجة الثقة
- توصيات ذكية

### 💹 محاكي التداول (AI Simulator)
- محاكاة صفقات واقعية
- حساب الربح والخسارة
- إدارة المحفظة
- تتبع الصفقات المفتوحة والمغلقة

### 📊 متتبع الأداء (Performance Tracker)
- تحليل الأداء اليومي
- إحصائيات شاملة
- معدل النجاح
- تقارير مفصلة

## 🛠️ التقنيات المستخدمة

- **Frontend**: React + TypeScript + Vite
- **UI Framework**: shadcn/ui + Tailwind CSS
- **State Management**: React Hooks
- **Icons**: Lucide React
- **Styling**: RTL Support للعربية

## 📦 التثبيت والإعداد

### المتطلبات الأساسية
- Node.js (v18 أو أحدث)
- pnpm (مدير الحزم)

### خطوات التثبيت

1. **استنساخ المشروع**
```bash
git clone <repository-url>
cd investing2
```

2. **تثبيت الحزم**
```bash
pnpm install
```

3. **إعداد المتغيرات البيئية**
```bash
cp .env.example .env
```

قم بتعديل ملف `.env` وإضافة مفاتيح API الخاصة بك:
- Twelve Data API Key (للبيانات الحقيقية)
- Telegram Bot Token (للإشعارات)
- Google Sheets API Key (للتخزين)

4. **تشغيل المشروع**
```bash
pnpm run dev
```

5. **بناء المشروع للإنتاج**
```bash
pnpm run build
```

## 🎮 الاستخدام

### الوضع التجريبي
النظام يعمل افتراضياً بوضع تجريبي يستخدم بيانات محاكاة. لتفعيل البيانات الحقيقية:

1. احصل على API Key من [Twelve Data](https://twelvedata.com/)
2. أضف المفتاح في ملف `.env`
3. غيّر `VITE_ENABLE_DEMO_MODE` إلى `false`

### الواجهة الرئيسية

#### 1. محلل السوق
- عرض جميع الإشارات المتاحة
- تصفية حسب نوع الإشارة (شراء/بيع/احتفاظ)
- عرض المؤشرات الفنية التفصيلية
- تقييم قوة كل إشارة

#### 2. محاكي التداول
- عرض الصفقات المفتوحة والمغلقة
- حساب الربح/الخسارة الفوري
- إحصائيات المحفظة
- تشغيل محاكاة يومية

#### 3. متتبع الأداء
- معدل النجاح
- صافي الربح اليومي
- الإشارات القوية والضعيفة
- توصيات ذكية

## 🔧 المكونات الأساسية

### الخدمات (Services)

#### AIAnalyzerService
```typescript
// تحليل سهم واحد
const signal = await aiAnalyzer.analyzeStock('AAPL');

// تحليل السوق بالكامل
const signals = await aiAnalyzer.analyzeMarket();

// الحصول على الإشارات القوية فقط
const strongSignals = await aiAnalyzer.getStrongSignals();

// تقييم إشارة
const evaluation = aiAnalyzer.evaluateSignal(signal);
```

#### TradingSimulatorService
```typescript
// فتح صفقة
const trade = tradingSimulator.openTrade(signal, 100);

// تحديث صفقة
tradingSimulator.updateTrade(tradeId, newPrice);

// إغلاق صفقة
tradingSimulator.closeTrade(tradeId, exitPrice);

// محاكاة يوم تداول
const trades = await tradingSimulator.simulateDailyTrading(signals);
```

## 🔌 التكاملات

### Twelve Data API
للحصول على بيانات السوق الحقيقية:

```typescript
const response = await fetch(
  `https://api.twelvedata.com/time_series?symbol=AAPL&interval=1day&apikey=${API_KEY}`
);
```

### Telegram Bot
لإرسال التنبيهات:

```typescript
const sendTelegramMessage = async (message: string) => {
  await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    }
  );
};
```

### Google Sheets
لتخزين البيانات:

```typescript
const appendToSheet = async (values: any[][]) => {
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1:append`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: values
      })
    }
  );
};
```

## 🐳 Docker Deployment

### ملف Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .

RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "run", "preview", "--host", "0.0.0.0", "--port", "3000"]
```

### ملف docker-compose.yml
```yaml
version: '3.8'

services:
  investing2:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    restart: unless-stopped
```

### تشغيل Docker
```bash
docker-compose up -d
```

## ⏰ الجدولة التلقائية

### استخدام Cron
أضف إلى crontab:

```bash
# تحليل السوق كل ساعة
0 * * * * cd /path/to/investing2 && node scripts/analyze.js

# تقرير يومي الساعة 9 صباحاً
0 9 * * * cd /path/to/investing2 && node scripts/daily-report.js

# تحديث البيانات كل 15 دقيقة
*/15 * * * * cd /path/to/investing2 && node scripts/update-data.js
```

## 📝 n8n Workflow

يمكن استيراد ملف `workflow.json` إلى n8n لتشغيل النظام آلياً:

1. افتح n8n
2. اذهب إلى Workflows
3. اضغط على Import from File
4. اختر `workflow.json`
5. قم بتعديل المفاتيح والإعدادات
6. فعّل الـ Workflow

## ❓ الأسئلة الشائعة

### هل النظام يدعم التداول الحقيقي؟
لا، النظام مصمم للتحليل والمحاكاة فقط. لا يتم تنفيذ صفقات حقيقية.

### كيف أحصل على بيانات حقيقية؟
سجل في [Twelve Data](https://twelvedata.com/) واحصل على API Key مجاني.

### هل يمكن إضافة أسهم جديدة؟
نعم، عدّل قائمة `DEMO_STOCKS` في ملف `aiAnalyzer.ts`.

### كيف أغيّر معايير التحليل؟
عدّل القيم في ملف `.env` مثل `VITE_RSI_PERIOD`.

## ⚠️ تنبيه مهم

هذا النظام لأغراض **تعليمية وتحليلية فقط**. لا يقدم نصائح استثمارية مباشرة. التداول الحقيقي يجب أن يتم فقط بعد:
- التحقق اليدوي من جميع الإشارات
- استشارة مستشار مالي مرخص
- فهم المخاطر المالية

## 📄 الترخيص

MIT License - يمكنك استخدام وتعديل الكود بحرية.

## 🤝 المساهمة

نرحب بالمساهمات! يرجى فتح Issue أو Pull Request.

## 📧 التواصل

لأي استفسارات أو دعم، يرجى التواصل عبر:
- GitHub Issues
- Email: support@investing2.com

---

**صُنع بـ ❤️ للمجتمع العربي**