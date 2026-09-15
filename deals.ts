// lib/deals.ts
// بيانات أولية (seed) فقط — تُستخدم مرة واحدة لملء قاعدة البيانات إذا كانت فارغة،
// حتى لا يظهر الموقع فارغاً قبل أول تشغيل ناجح لجلب العروض التلقائي (cron).
//
// - العينات المجانية (free: true) تبقى دائماً في القاعدة (source: seed_free).
// - العروض الوهمية المقفولة (free: false) تُحذف تلقائياً أول ما ينجح الـ cron
//   بجلب عروض حقيقية (source: seed_locked) — راجع lib/deals-service.ts

export type Deal = {
  id: string;
  title: string;
  store: "Amazon" | "AliExpress" | "Shein" | "Booking";
  originalPrice: number;
  discountedPrice: number;
  currency: string;
  imageUrl: string;
  directUrl: string;
  free: boolean;
  updatedAt: string;
};

export const seedFreeDeals: Deal[] = [
  {
    id: "seed-free-001",
    title: "Wireless Noise-Cancelling Headphones",
    store: "Amazon",
    originalPrice: 199,
    discountedPrice: 89,
    currency: "USD",
    imageUrl: "https://placehold.co/400x300?text=Headphones",
    directUrl: "https://www.amazon.com/dp/EXAMPLE001",
    free: true,
    updatedAt: "2026-09-15",
  },
  {
    id: "seed-free-002",
    title: "Smart Fitness Watch Series 5",
    store: "AliExpress",
    originalPrice: 65,
    discountedPrice: 22,
    currency: "USD",
    imageUrl: "https://placehold.co/400x300?text=Smart+Watch",
    directUrl: "https://www.aliexpress.com/item/EXAMPLE002.html",
    free: true,
    updatedAt: "2026-09-15",
  },
];

export const seedLockedDeals: Deal[] = [
  {
    id: "seed-locked-001",
    title: "Boho Summer Dress Collection",
    store: "Shein",
    originalPrice: 45,
    discountedPrice: 14,
    currency: "USD",
    imageUrl: "https://placehold.co/400x300?text=Summer+Dress",
    directUrl: "https://www.shein.com/EXAMPLE003.html",
    free: false,
    updatedAt: "2026-09-15",
  },
  {
    id: "seed-locked-002",
    title: "4-Star Beach Resort — 3 Nights",
    store: "Booking",
    originalPrice: 480,
    discountedPrice: 210,
    currency: "USD",
    imageUrl: "https://placehold.co/400x300?text=Beach+Resort",
    directUrl: "https://www.booking.com/hotel/EXAMPLE004.html",
    free: false,
    updatedAt: "2026-09-15",
  },
];
