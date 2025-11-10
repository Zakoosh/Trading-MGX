# خطة التطوير - نظام التداول الآلي

## المهام المطلوبة:

### 1. إصلاح Gemini API ✅
- [x] تغيير النموذج إلى gemini-1.5-pro-latest
- [x] استخدام v1beta API
- [x] إضافة safety settings

### 2. تعريب واجهة المستخدم 🔄
- [ ] تعريب جميع التبويبات (Tabs)
- [ ] تعريب الأزرار والنصوص
- [ ] تحديث ملف الترجمة

### 3. نظام الأدمن للمدير (zalbeltaji@gmail.com) 🔄
- [ ] إنشاء صفحة Admin Dashboard
- [ ] صلاحيات خاصة للأدمن
- [ ] إدارة المتغيرات والإعدادات
- [ ] إدارة المستخدمين وصلاحياتهم

### 4. قائمة المتابعة التلقائية 🔄
- [ ] إنشاء جدول watchlist في Supabase
- [ ] حفظ قائمة الأسهم المحددة للمدير
- [ ] نظام تحليل تلقائي دوري
- [ ] إشعارات تلقائية عند الإشارات القوية

### 5. نظام API Keys للمستخدمين 🔄
- [ ] جدول api_keys في Supabase
- [ ] خيار للأدمن: السماح باستخدام مفاتيحه
- [ ] خيار للمستخدمين: إضافة مفاتيحهم الخاصة
- [ ] واجهة إدارة المفاتيح

## قائمة الأسهم للمتابعة:
```json
[
  {"symbol": "AAPL", "name": "Apple Inc.", "market": "US"},
  {"symbol": "MSFT", "name": "Microsoft Corp.", "market": "US"},
  {"symbol": "NVDA", "name": "NVIDIA Corp.", "market": "US"},
  {"symbol": "GOOGL", "name": "Alphabet Inc.", "market": "US"},
  {"symbol": "TSLA", "name": "Tesla Inc.", "market": "US"},
  {"symbol": "META", "name": "Meta Platforms Inc.", "market": "US"},
  {"symbol": "AMZN", "name": "Amazon.com Inc.", "market": "US"},
  {"symbol": "JNJ", "name": "Johnson & Johnson", "market": "US"},
  {"symbol": "PG", "name": "Procter & Gamble Co.", "market": "US"},
  {"symbol": "AVGO", "name": "Broadcom Inc.", "market": "US"},
  {"symbol": "CAN", "name": "Canaan Inc.", "market": "US"},
  {"symbol": "BTCUSD", "name": "Bitcoin / US Dollar", "market": "Crypto"},
  {"symbol": "XAUUSD", "name": "Gold / US Dollar", "market": "Commodities"},
  {"symbol": "BIMAS.IS", "name": "BIM Birleşik Mağazalar", "market": "Turkey"},
  {"symbol": "ASELS.IS", "name": "Aselsan Elektronik", "market": "Turkey"},
  {"symbol": "TUPRS.IS", "name": "Tüpraş Petrol", "market": "Turkey"},
  {"symbol": "AKSA.IS", "name": "Aksa Akrilik", "market": "Turkey"}
]
```

## الأولويات:
1. إصلاح Gemini API (عاجل) ✅
2. تعريب الواجهة (مهم)
3. نظام الأدمن (مهم)
4. قائمة المتابعة التلقائية (مهم)
5. نظام API Keys (متوسط)