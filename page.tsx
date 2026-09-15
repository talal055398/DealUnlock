import { getPublicDeals } from "@/lib/deals-service";
import HomeClient from "./home-client";

// Server Component: يجيب العروض من القاعدة على السيرفر فقط.
// العروض المقفولة تُرسل للمتصفح بدون حقل directUrl إطلاقاً — لا تسريب ممكن
// حتى لو فتح حد أدوات المطوّر وقرأ كود الصفحة.
export default async function HomePage() {
  const { free, locked } = await getPublicDeals();

  return <HomeClient freeDeals={free} lockedDeals={locked} />;
}
