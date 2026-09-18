 DealUnlock

موقع اشتراك شهري ($10) للوصول لقائمة يومية مُنسّقة ومُتحقق منها من أقوى
الخصومات الحقيقية على Amazon و AliExpress و Shein و Booking.

**الموديل:** عينة مجانية كاملة تشوفها بدون دفع + قائمة كاملة مقفولة تُفتح
بالاشتراك عبر Lemon Squeezy. لا يوجد "حجب رابط عام" — القيمة المدفوعة هي
البحث والتحقق والتنسيق اليومي.

---

## 1. الإعداد على Lemon Squeezy

1. أنشئ **Store** إن ما عندك واحد.
2. أنشئ **Product** من نوع اشتراك (Subscription) بسعر $10/شهرياً، وخذ الـ
   **Variant ID** بتاعه.
3. من إعدادات الـ Store خذ الـ **Store ID**.
4. من Settings → API خذ **API Key**.
5. من Settings → Webhooks:
   - أنشئ Webhook جديد، الرابط: `https://your-app.vercel.app/api/webhook`
   - فعّل الأحداث: `subscription_created`, `subscription_updated`,
     `subscription_cancelled`, `subscription_expired`, `subscription_payment_success`
   - خذ الـ **Signing Secret** وحطه بـ `LEMONSQUEEZY_WEBHOOK_SECRET`

---

## 2. رفع المشروع لـ GitHub من الجوال

أسهل طريقة بدون تثبيت أي شي على الجوال:

1. افتح **github.com** من متصفح الجوال وسجل دخول.
2. أنشئ **repository** جديد اسمه `dealunlock`.
3. استخدم خاصية **"Upload files"** بصفحة الـ repo وارفع كل الملفات
   والمجلدات (تقدر تضغطها بملف zip وترفعه، GitHub يفك الضغط تلقائياً لو
   رفعته بطريقة "Add file → Upload files" بعد فك الضغط محلياً، أو استخدم
   تطبيق مثل **Working Copy** (iOS) أو **Termux + git** (Android) لو تبي
   تحكم أدق بالـ git من الجوال مباشرة).

بديل أسهل: نزّل تطبيق **GitHub Mobile** أو استخدم متصفح الجوال مباشرة —
كلاهما يدعم رفع ملفات وإنشاء commits بدون كمبيوتر.

---

## 3. النشر على Vercel

1. افتح **vercel.com** من الجوال وسجل دخول بحساب GitHub.
2. اضغط **New Project** واختر الـ repo `dealunlock`.
3. قبل الضغط على Deploy، أضف متغيرات البيئة (Environment Variables) من
   ملف `.env.example`:
   - `LEMONSQUEEZY_API_KEY`
   - `LEMONSQUEEZY_STORE_ID`
   - `LEMONSQUEEZY_VARIANT_ID`
   - `LEMONSQUEEZY_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_URL` (حط رابط Vercel اللي راح يطلع لك، تقدر تحدّثه بعد أول نشر)
4. اضغط **Deploy**.

## 4. تفعيل قاعدة البيانات (Vercel Postgres)

1. من داشبورد المشروع على Vercel → تبويب **Storage** → **Create Database**
   → اختر **Postgres**.
2. Vercel بيضيف `DATABASE_URL` تلقائياً لمتغيرات البيئة.
3. أعد النشر (Redeploy) عشان يلتقط المتغير الجديد.

> ملاحظة: بدون `DATABASE_URL` الموقع يشتغل محلياً فقط بقاعدة بيانات SQLite
> محلية (`dev.db`) — هذي لا تصلح للإنتاج على Vercel لأن نظام الملفات مؤقت.
> لازم تفعّل Postgres قبل النشر النهائي.

---

## 5. التحديث التلقائي اليومي للعروض

القائمة تتحدّث تلقائياً بدون تدخل يدوي عبر **Vercel Cron** + **AliExpress
Affiliate API**:

1. سجّل كـ Affiliate على AliExpress من https://portals.aliexpress.com
   (القبول عادة خلال يوم إلى يومين، وبدون شرط مبيعات مسبقة — على عكس Amazon
   اللي يتطلب 3 عمليات بيع أولاً قبل ما يعطيك مفاتيح API، فخلّيه لمرحلة لاحقة
   بعد ما يكون عندك مبيعات).
2. من App Console بمنصة open.aliexpress.com أنشئ تطبيق وخذ
   `ALIEXPRESS_APP_KEY` و `ALIEXPRESS_APP_SECRET`، ومن حسابك كـ Affiliate خذ
   `ALIEXPRESS_TRACKING_ID`.
3. ولّد قيمة عشوائية طويلة وحطها بمتغيّر `CRON_SECRET` (نفس القيمة بالضبط
   بإعدادات Vercel).
4. أضف الأربع متغيرات دي بـ Vercel → Settings → Environment Variables،
   وأعد النشر.

من هذه اللحظة، `vercel.json` يشغّل `/api/cron/refresh-deals` تلقائياً
**مرة كل يوم** (خطة Vercel المجانية Hobby ما تسمح بأكثر من مرة يومياً، والتوقيت
تقريبي بحدود ساعة). كل تشغيل يجيب أحدث العروض من AliExpress ويستبدل الدفعة
القديمة بالكامل، ويحذف تلقائياً العروض الوهمية الابتدائية (seed) أول ما توصل
عروض حقيقية.

**لو ما فعّلت المتغيرات بعد:** الموقع يستمر يشتغل طبيعي بعروض seed الوهمية
كعنصر مؤقت — ما راح ينكسر، بس ما راح يتحدّث تلقائياً لين تضيف المفاتيح.

**لإضافة مصادر ثانية لاحقاً** (Amazon بعد ما تحقق 3 مبيعات، أو Shein/Booking
عبر شبكات affiliate زي Awin/CJ): أضف ملف جديد بنفس نمط
`lib/sources/aliexpress.ts`، واستدعيه من
`app/api/cron/refresh-deals/route.ts`.

**تحذير مهم:** لا تكتب بالموقع "تحديث يومي" إلا إذا فعلاً فعّلت هذا الجزء
والتزم بالجدولة — وعد تسويقي غير صحيح لخدمة مدفوعة يعرّضك لمشاكل قانونية
حقيقية بأمريكا وأوروبا (false advertising).

---

## الأمان

- توقيع الـ Webhook يُتحقق منه بـ HMAC SHA256 قبل أي معالجة.
- لا تُسجَّل أي بيانات شخصية (إيميلات) بالـ logs.
- الروابط المباشرة لا تظهر إلا لمشترك فعّال (يُتحقق منه بقاعدة البيانات
  بكل طلب، مو بمجرد كوكيز).
- العروض المقفولة تُجهَّز على السيرفر فقط (`lib/deals-service.ts`) بدون
  حقل `directUrl` إطلاقاً — الرابط المباشر لا يصل للمتصفح لغير المشتركين
  حتى لو فحص حد كود الصفحة من أدوات المطوّر.
- رابط الـ cron محمي بـ `CRON_SECRET` — بدونه أي حد يقدر يستدعيه ويستهلك
  حصتك من طلبات AliExpress API.
