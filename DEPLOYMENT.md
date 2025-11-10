# 🚀 دليل النشر الكامل

هذا الدليل يشرح كيفية نشر نظام التداول الذكي ليعمل 24/7 مع تحليل تلقائي وتنبيهات Telegram.

## 📋 المتطلبات

1. **حساب GitHub** (مجاني)
2. **حساب Vercel** (مجاني) - [vercel.com](https://vercel.com)
3. **Telegram Bot** (مجاني)
4. **Gemini API Key** (مجاني)

---

## 🔧 الخطوة 1: إعداد Telegram Bot

### 1.1 إنشاء البوت

1. افتح Telegram وابحث عن `@BotFather`
2. أرسل `/newbot`
3. اختر اسم للبوت (مثل: `My Trading Bot`)
4. اختر username (مثل: `my_trading_bot`)
5. احفظ الـ **Bot Token** (يبدو مثل: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 1.2 الحصول على Chat ID

1. ابحث عن `@userinfobot` في Telegram
2. أرسل أي رسالة
3. احفظ الـ **Chat ID** (رقم مثل: `123456789`)

---

## 🔑 الخطوة 2: الحصول على Gemini API Key

1. اذهب إلى [Google AI Studio](https://makersuite.google.com/app/apikey)
2. سجل دخول بحساب Google
3. اضغط "Create API Key"
4. احفظ الـ **API Key**

---

## 📦 الخطوة 3: رفع الكود على GitHub

### 3.1 إنشاء Repository جديد

1. اذهب إلى [github.com/new](https://github.com/new)
2. اسم المشروع: `trading-system` (أو أي اسم)
3. اختر **Public** (للاستفادة من GitHub Actions المجاني)
4. اضغط "Create repository"

### 3.2 رفع الكود

```bash
cd /workspace/shadcn-ui

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Trading system with automated analysis"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/trading-system.git

# Push
git branch -M main
git push -u origin main
```

---

## 🌐 الخطوة 4: النشر على Vercel

### 4.1 ربط GitHub بـ Vercel

1. اذهب إلى [vercel.com](https://vercel.com)
2. سجل دخول بحساب GitHub
3. اضغط "New Project"
4. اختر repository `trading-system`
5. اضغط "Import"

### 4.2 إعداد Environment Variables

في صفحة إعدادات المشروع، أضف المتغيرات التالية:

```
GEMINI_API_KEY=your_gemini_api_key_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
TWELVE_DATA_API_KEY=your_twelve_data_key_here (اختياري)
ALPACA_API_KEY=your_alpaca_key_here (اختياري)
ALPACA_API_SECRET=your_alpaca_secret_here (اختياري)
```

### 4.3 النشر

1. اضغط "Deploy"
2. انتظر 2-3 دقائق
3. احصل على رابط الموقع (مثل: `https://trading-system.vercel.app`)

---

## ⚙️ الخطوة 5: إعداد GitHub Actions

### 5.1 إضافة Secrets في GitHub

1. اذهب إلى repository على GitHub
2. Settings → Secrets and variables → Actions
3. اضغط "New repository secret"
4. أضف الـ Secrets التالية:

```
VERCEL_URL=https://trading-system.vercel.app
GEMINI_API_KEY=your_gemini_api_key_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
```

### 5.2 تفعيل GitHub Actions

1. اذهب إلى تبويب "Actions" في repository
2. إذا طُلب منك، اضغط "I understand my workflows, go ahead and enable them"
3. Workflow سيعمل تلقائياً حسب الجدولة

---

## 🧪 الخطوة 6: الاختبار

### 6.1 اختبار يدوي لـ GitHub Actions

1. اذهب إلى تبويب "Actions"
2. اختر workflow "Automated Stock Analysis"
3. اضغط "Run workflow"
4. انتظر 1-2 دقيقة
5. تحقق من Telegram - يجب أن تصلك رسالة!

### 6.2 اختبار الواجهة

1. افتح رابط Vercel: `https://trading-system.vercel.app`
2. جرب المحلل الذكي
3. جرب المحاكي الذكي
4. تحقق من حفظ البيانات

---

## 📅 الجدولة التلقائية

### الجدول الافتراضي:

- **كل 4 ساعات** (9 AM, 1 PM, 5 PM, 9 PM EST): تحليل تلقائي + تنبيهات
- **يومياً الساعة 9 صباحاً EST**: تقرير يومي شامل

### تخصيص الجدولة:

عدّل ملف `.github/workflows/analyze.yml`:

```yaml
on:
  schedule:
    # كل ساعة
    - cron: '0 * * * *'
    
    # كل 6 ساعات
    - cron: '0 */6 * * *'
    
    # مرتين يومياً (9 AM و 5 PM)
    - cron: '0 9,17 * * *'
```

---

## 🎯 كيف يعمل النظام الكامل

```
┌─────────────────────────────────────────┐
│  GitHub Actions (السحابة - 24/7)       │
│                                         │
│  كل 4 ساعات:                           │
│  1. يستدعي API على Vercel              │
│  2. يحلل الأسهم بالذكاء الاصطناعي      │
│  3. يقيّم الإشارات                     │
│  4. يرسل تقرير لـ Telegram             │
└─────────────────────────────────────────┘
                  ↓
         📱 تصلك رسالة Telegram
                  ↓
┌─────────────────────────────────────────┐
│  أنت تفتح الموقع (في أي وقت)          │
│                                         │
│  ✓ تراجع التحليلات الجاهزة            │
│  ✓ تفعّل التداول الحقيقي              │
│  ✓ تراقب الأداء                        │
│  ✓ كل شيء محفوظ في localStorage        │
└─────────────────────────────────────────┘
```

---

## 🔧 استكشاف الأخطاء

### المشكلة: لا تصل رسائل Telegram

**الحل:**
1. تحقق من Bot Token و Chat ID
2. تأكد من إضافة Secrets في GitHub
3. تحقق من Environment Variables في Vercel
4. جرب إرسال رسالة يدوية للبوت أولاً

### المشكلة: GitHub Actions لا يعمل

**الحل:**
1. تحقق من تفعيل Actions في Settings
2. تحقق من Secrets في repository
3. راجع logs في تبويب Actions
4. تأكد من صحة VERCEL_URL

### المشكلة: التحليل يفشل

**الحل:**
1. تحقق من Gemini API Key
2. تأكد من عدم تجاوز حد الاستخدام المجاني
3. راجع logs في Vercel

---

## 💡 نصائح مهمة

1. **GitHub Actions مجاني** للمشاريع Public (2000 دقيقة/شهر)
2. **Vercel مجاني** للمشاريع الشخصية (100 GB bandwidth/شهر)
3. **Gemini API مجاني** (60 requests/minute)
4. **احفظ نسخة احتياطية** من Secrets في مكان آمن
5. **راقب الاستخدام** لتجنب تجاوز الحدود المجانية

---

## 📞 الدعم

إذا واجهت أي مشاكل:

1. راجع logs في GitHub Actions
2. راجع logs في Vercel
3. تحقق من Telegram Bot
4. تأكد من صحة جميع API Keys

---

## 🎉 تهانينا!

نظامك الآن يعمل 24/7 مع:
- ✅ تحليل تلقائي كل 4 ساعات
- ✅ تنبيهات Telegram فورية
- ✅ تقارير يومية شاملة
- ✅ واجهة ويب تعمل دائماً
- ✅ حفظ تلقائي للبيانات

**استمتع بالتداول الذكي! 🚀**