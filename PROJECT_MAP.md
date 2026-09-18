# خريطة المشروع

```
app/
  layout.tsx                       ← Layout عام (RTL + عنوان الموقع)
  globals.css                      ← استيراد Tailwind
  page.tsx                         ← Server Component: يجيب العروض من قاعدة
                                      البيانات (عبر lib/deals-service.ts) ويمررها
                                      لـ home-client.tsx — بدون أي رابط مقفول
  home-client.tsx                  ← الجزء التفاعلي (client): نموذج التحقق من
                                      الاشتراك + زر الاشتراك + عرض البطاقات
  success/page.tsx                 ← تظهر بعد الدفع، توجّه المستخدم يتحقق بإيميله
  api/
    checkout/route.ts              ← POST: ينشئ جلسة Lemon Squeezy Checkout
                                      (اشتراك، مو دفعة لمرة وحدة) ويرجّع رابط الدفع
    webhook/route.ts               ← POST: يستقبل أحداث الاشتراك من Lemon Squeezy،
                                      يتحقق من التوقيع (HMAC)، يحدّث جدول subscribers
    check-subscription/route.ts    ← POST: يستقبل إيميل، يتحقق من الاشتراك الفعّال
                                      بقاعدة البيانات، يرجّع القائمة الكاملة لو فعّال
    cron/refresh-deals/route.ts    ← GET: يستدعيها Vercel Cron يومياً تلقائياً،
                                      يجيب عروض AliExpress ويحدّث قاعدة البيانات

lib/
  deals.ts                         ← بيانات seed فقط (عينات مجانية ثابتة +
                                      عروض وهمية مؤقتة قبل أول تشغيل cron ناجح)
  deals-service.ts                 ← server-only: يدمج seed + DB، ويخفي
                                      directUrl تماماً عن العروض المقفولة
  db.ts                            ← طبقة قاعدة بيانات (SQLite محلياً / Postgres
                                      بالإنتاج) — جدولان: subscribers و deals
  lemonsqueezy.ts                  ← دوال مساعدة: إنشاء checkout + التحقق من
                                      توقيع الـ webhook
  sources/aliexpress.ts            ← جلب عروض حقيقية تلقائياً عبر AliExpress
                                      Affiliate API (المصدر التلقائي الحالي)

vercel.json                        ← جدولة الـ cron (مرة يومياً، أقصى حد بخطة Hobby)
.env.example                       ← قائمة متغيرات البيئة المطلوبة
package.json                       ← الاعتماديات (بدون Redux/GraphQL/Prisma)
README.md                          ← خطوات الإعداد والنشر كاملة (من الجوال)
```

## تدفق عملية الاشتراك والدفع (Flow)

1. المستخدم يزور `/` → السيرفر يجيب العروض من قاعدة البيانات ويقسمها:
   عينة مجانية كاملة، وعروض مقفولة **بدون** حقل الرابط المباشر إطلاقاً.
2. يضغط "اشترك الآن" → `POST /api/checkout` → يتحول لصفحة دفع Lemon Squeezy.
3. بعد الدفع → Lemon Squeezy يرسل حدث `subscription_created` إلى
   `POST /api/webhook` → يتحقق من التوقيع → يحفظ الإيميل بجدول `subscribers`
   بحالة `active`.
4. Lemon Squeezy يحوّل المستخدم إلى `/success`.
5. المستخدم يرجع للصفحة الرئيسية، يدخل نفس الإيميل، يضغط "تحقق من اشتراكي"
   → `POST /api/check-subscription` → لو فعّال يرجّع القائمة الكاملة بالروابط
   المباشرة (يُجهَّز هذا فقط على السيرفر، بعد التحقق) وتظهر بالواجهة.

## تدفق التحديث التلقائي للعروض (Cron Flow)

1. Vercel Cron يستدعي `GET /api/cron/refresh-deals` مرة يومياً تلقائياً
   (مع هيدر `Authorization: Bearer <CRON_SECRET>`).
2. المسار يتحقق من الـ secret، ثم يستدعي `fetchAliExpressDeals()`.
3. `replaceSourceDeals("aliexpress", ...)` يحذف الدفعة القديمة من نفس
   المصدر ويحفظ الدفعة الجديدة كاملة بجدول `deals`.
4. لو نجحت الدفعة الأولى، تُحذف تلقائياً عروض seed الوهمية (`seed_locked`).
5. عروض seed المجانية (`seed_free`) تبقى دائماً — هي العينة المجانية الثابتة.

## نقاط توسّع مستقبلية (خارج الـ Scope الحالي)

- تسجيل دخول حقيقي (magic link) بدل إدخال الإيميل يدوياً بكل زيارة.
- مصدر Amazon PA-API بعد تحقيق 3 مبيعات مؤهلة (شرط أمازون نفسه).
- مصادر Shein / Booking عبر شبكات affiliate (Awin، CJ، Partnerize).
- صفحة إدارة (admin) لإضافة/تعديل عروض يدوية بدون رفع كود جديد.
