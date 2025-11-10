# 📦 رفع المشروع على GitHub - دليل سريع

## ✅ الخطوة 1: تهيئة Git (إذا لم يكن مُهيأ)

افتح Terminal في مجلد المشروع وقم بتنفيذ:

```bash
cd /workspace/shadcn-ui

# تهيئة git (إذا لم يكن مُهيأ)
git init

# إضافة جميع الملفات
git add .

# إنشاء commit أول
git commit -m "Initial commit: Trading AI System with automated analysis"
```

---

## ✅ الخطوة 2: ربط المشروع بـ GitHub Repository

**استبدل `YOUR_USERNAME` و `YOUR_REPO_NAME` باسم المستخدم واسم المشروع الخاص بك:**

```bash
# إضافة remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# تغيير اسم الفرع إلى main
git branch -M main

# رفع الكود
git push -u origin main
```

---

## 🔑 الخطوة 3: إضافة Secrets في GitHub

بعد رفع الكود، اذهب إلى:

**GitHub Repository → Settings → Secrets and variables → Actions → New repository secret**

أضف الـ Secrets التالية:

### 1. VERCEL_URL
```
https://your-project-name.vercel.app
```
(ستحصل عليه بعد النشر على Vercel)

### 2. GEMINI_API_KEY
```
your_gemini_api_key_here
```
احصل عليه من: https://makersuite.google.com/app/apikey

### 3. TELEGRAM_BOT_TOKEN
```
123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```
احصل عليه من @BotFather على Telegram

### 4. TELEGRAM_CHAT_ID
```
123456789
```
احصل عليه من @userinfobot على Telegram

---

## 🌐 الخطوة 4: إعداد Vercel

### 4.1 ربط GitHub بـ Vercel

1. اذهب إلى [vercel.com/new](https://vercel.com/new)
2. اختر "Import Git Repository"
3. اختر repository الذي أنشأته
4. اضغط "Import"

### 4.2 إعداد Build Settings

Vercel سيكتشف إعدادات المشروع تلقائياً:
- **Framework Preset**: Vite
- **Build Command**: `pnpm run build`
- **Output Directory**: `dist`

### 4.3 إضافة Environment Variables

في صفحة إعدادات المشروع على Vercel، أضف:

```
GEMINI_API_KEY=your_gemini_api_key_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
VITE_TELEGRAM_CHAT_ID=your_telegram_chat_id_here
```

### 4.4 النشر

1. اضغط "Deploy"
2. انتظر 2-3 دقائق
3. احصل على رابط الموقع (مثل: `https://trading-system.vercel.app`)

---

## ✅ الخطوة 5: تحديث VERCEL_URL في GitHub

بعد حصولك على رابط Vercel:

1. اذهب إلى GitHub Repository → Settings → Secrets → Actions
2. أضف أو عدّل `VERCEL_URL` بالرابط الجديد
3. مثال: `https://trading-system.vercel.app`

---

## 🧪 الخطوة 6: اختبار GitHub Actions

1. اذهب إلى GitHub Repository → Actions
2. اختر workflow "Automated Stock Analysis"
3. اضغط "Run workflow" → "Run workflow"
4. انتظر 1-2 دقيقة
5. تحقق من Telegram - يجب أن تصلك رسالة!

---

## 🎉 تم بنجاح!

الآن نظامك يعمل 24/7:
- ✅ الموقع متاح على: `https://your-project.vercel.app`
- ✅ GitHub Actions يحلل تلقائياً كل 4 ساعات
- ✅ تنبيهات Telegram تصل فوراً
- ✅ تقارير يومية الساعة 9 صباحاً

---

## 🔄 التحديثات المستقبلية

عند إجراء أي تعديلات على الكود:

```bash
git add .
git commit -m "وصف التعديل"
git push
```

Vercel سيُحدّث الموقع تلقائياً خلال 1-2 دقيقة!

---

## 📞 المساعدة

إذا واجهت أي مشاكل:
1. راجع logs في GitHub Actions
2. راجع logs في Vercel
3. تحقق من Environment Variables
4. تأكد من صحة جميع API Keys