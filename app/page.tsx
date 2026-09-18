import { getPublicDeals } from "@/lib/deals-service";
import HomeClient from "./home-client";

// يمنع Next.js من محاولة تجهيز الصفحة وقت البناء (Build) عبر قاعدة البيانات —
// الصفحة تُحمَّل دائماً وقت الطلب الفعلي (Runtime)، وهذا صحيح أصلاً لأن
// العروض تتغيّر يومياً عبر الـ cron، فما نبيها مخزّنة ثابتة وقت البناء.
export const dynamic = "force-dynamic";

// Server Component: يجيب العروض من القاعدة على السيرفر فقط.
// العروض المقفولة تُرسل للمتصفح بدون حقل directUrl إطلاقاً — لا تسريب ممكن
// حتى لو فتح حد أدوات المطوّر وقرأ كود الصفحة.
export default async function HomePage() {
  const { free, locked } = await getPublicDeals();

  return <HomeClient freeDeals={free} lockedDeals={locked} />;
}
