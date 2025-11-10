# إعداد قاعدة البيانات Supabase

## 🎯 نظرة عامة
تم تكوين Supabase بنجاح! الآن تحتاج إلى إنشاء الجداول اللازمة في قاعدة البيانات.

## 📊 الجداول المطلوبة

### 1. جدول المحافظ (portfolios)
يحفظ معلومات المحفظة لكل مستخدم

### 2. جدول الصفقات (trades)
يحفظ سجل جميع الصفقات المفتوحة والمغلقة

## 🔧 خطوات الإعداد

### الخطوة 1: افتح Supabase SQL Editor
1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك: `zqfcukvoovjobyboqanf`
3. من القائمة الجانبية، اختر **SQL Editor**
4. انقر على **New Query**

### الخطوة 2: نفذ SQL التالي

```sql
-- إنشاء جدول المحافظ
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  total_value DECIMAL(15, 2) DEFAULT 0,
  cash DECIMAL(15, 2) DEFAULT 100000,
  invested_amount DECIMAL(15, 2) DEFAULT 0,
  total_pl DECIMAL(15, 2) DEFAULT 0,
  total_pl_percent DECIMAL(10, 4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- إنشاء فهرس لتسريع الاستعلامات
CREATE INDEX IF NOT EXISTS portfolios_user_id_idx ON portfolios(user_id);

-- تفعيل Row Level Security
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة: المستخدم يمكنه قراءة محفظته فقط
CREATE POLICY "Users can view their own portfolio"
  ON portfolios FOR SELECT
  USING (auth.uid() = user_id);

-- سياسة الإدراج: المستخدم يمكنه إنشاء محفظته فقط
CREATE POLICY "Users can insert their own portfolio"
  ON portfolios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- سياسة التحديث: المستخدم يمكنه تحديث محفظته فقط
CREATE POLICY "Users can update their own portfolio"
  ON portfolios FOR UPDATE
  USING (auth.uid() = user_id);

-- إنشاء جدول الصفقات
CREATE TABLE IF NOT EXISTS trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(10) CHECK (type IN ('buy', 'sell')) NOT NULL,
  entry_price DECIMAL(15, 4) NOT NULL,
  current_price DECIMAL(15, 4) NOT NULL,
  quantity INTEGER NOT NULL,
  profit DECIMAL(15, 2) DEFAULT 0,
  profit_percent DECIMAL(10, 4) DEFAULT 0,
  status VARCHAR(10) CHECK (status IN ('open', 'closed')) DEFAULT 'open',
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- إنشاء فهارس لتسريع الاستعلامات
CREATE INDEX IF NOT EXISTS trades_user_id_idx ON trades(user_id);
CREATE INDEX IF NOT EXISTS trades_symbol_idx ON trades(symbol);
CREATE INDEX IF NOT EXISTS trades_status_idx ON trades(status);
CREATE INDEX IF NOT EXISTS trades_opened_at_idx ON trades(opened_at DESC);

-- تفعيل Row Level Security
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة: المستخدم يمكنه قراءة صفقاته فقط
CREATE POLICY "Users can view their own trades"
  ON trades FOR SELECT
  USING (auth.uid() = user_id);

-- سياسة الإدراج: المستخدم يمكنه إنشاء صفقاته فقط
CREATE POLICY "Users can insert their own trades"
  ON trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- سياسة التحديث: المستخدم يمكنه تحديث صفقاته فقط
CREATE POLICY "Users can update their own trades"
  ON trades FOR UPDATE
  USING (auth.uid() = user_id);

-- سياسة الحذف: المستخدم يمكنه حذف صفقاته فقط
CREATE POLICY "Users can delete their own trades"
  ON trades FOR DELETE
  USING (auth.uid() = user_id);

-- إنشاء دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء trigger لتحديث updated_at في جدول portfolios
CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### الخطوة 3: تحقق من الإنشاء
بعد تنفيذ SQL، تحقق من:
1. وجود جدول `portfolios` في قاعدة البيانات
2. وجود جدول `trades` في قاعدة البيانات
3. تفعيل Row Level Security على الجدولين
4. وجود السياسات (Policies) المطلوبة

## ✅ التحقق من العمل

بعد إنشاء الجداول، يمكنك:

1. **تسجيل الدخول** - استخدم صفحة تسجيل الدخول
2. **حفظ البيانات** - سيتم حفظ محفظتك وصفقاتك تلقائياً
3. **استرجاع البيانات** - عند تسجيل الدخول مرة أخرى، ستجد بياناتك محفوظة

## 🔐 الأمان

- ✅ Row Level Security مفعل
- ✅ كل مستخدم يرى بياناته فقط
- ✅ لا يمكن للمستخدمين الوصول لبيانات بعضهم البعض
- ✅ جميع العمليات محمية بسياسات الأمان

## 📝 ملاحظات

- **المحفظة الافتراضية**: تبدأ بـ $100,000 نقد
- **الصفقات**: يتم حفظها تلقائياً عند التنفيذ
- **التحديثات**: يتم تحديث `updated_at` تلقائياً

## 🆘 حل المشاكل

إذا واجهت أي مشاكل:

1. **تحقق من الاتصال**: افتح Console في المتصفح وابحث عن أخطاء Supabase
2. **تحقق من الجداول**: تأكد من إنشاء الجداول بنجاح في SQL Editor
3. **تحقق من السياسات**: تأكد من وجود جميع Policies في قسم Authentication > Policies
4. **أعد تشغيل التطبيق**: أحياناً يحتاج التطبيق لإعادة تشغيل بعد إنشاء الجداول

## 🚀 الخطوات التالية

بعد إعداد Supabase بنجاح:

1. ✅ سجل دخول جديد أو أنشئ حساب
2. ✅ ابدأ التداول وسيتم حفظ كل شيء
3. ✅ أغلق المتصفح وافتحه مرة أخرى - بياناتك محفوظة!
4. ✅ استمتع بنظام تداول كامل مع حفظ دائم للبيانات

---

**تم إعداد Supabase بنجاح! 🎉**