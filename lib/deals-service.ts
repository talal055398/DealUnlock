// lib/deals-service.ts
// طبقة server-only — تجمع العروض من قاعدة البيانات، وتضمن عدم تسريب
// الروابط المباشرة (direct_url) لغير المشتركين الفعّالين عبر الشبكة.
//
// مهم جداً: لا تستورد هذا الملف داخل أي مكوّن "use client" — استخدمه فقط
// داخل Server Components أو Route Handlers.

import "server-only";
import {
  countDeals,
  deleteDealsBySource,
  getAllDealsFromDb,
  upsertDeal,
  type DealRow,
} from "@/lib/db";
import { seedFreeDeals, seedLockedDeals, type Deal } from "@/lib/deals";

function rowToDeal(r: DealRow): Deal {
  return {
    id: r.id,
    title: r.title,
    store: r.store as Deal["store"],
    originalPrice: Number(r.original_price),
    discountedPrice: Number(r.discounted_price),
    currency: r.currency,
    imageUrl: r.image_url,
    directUrl: r.direct_url,
    free: r.is_free,
    updatedAt: r.updated_at,
  };
}

// تُستدعى تلقائياً أول قراءة — تملأ القاعدة بالعينات الأولية إذا كانت فارغة تماماً
async function ensureSeeded() {
  const count = await countDeals();
  if (count > 0) return;

  for (const d of [...seedFreeDeals, ...seedLockedDeals]) {
    await upsertDeal({
      id: d.id,
      title: d.title,
      store: d.store,
      original_price: d.originalPrice,
      discounted_price: d.discountedPrice,
      currency: d.currency,
      image_url: d.imageUrl,
      direct_url: d.directUrl,
      is_free: d.free,
      source: d.free ? "seed_free" : "seed_locked",
    });
  }
}

// القائمة الكاملة (بالروابط) — تُستخدم فقط بعد التحقق من اشتراك فعّال على السيرفر
export async function getFullDeals(): Promise<Deal[]> {
  await ensureSeeded();
  const rows = await getAllDealsFromDb();
  return rows.map(rowToDeal);
}

// نسخة آمنة للعرض العام — بدون directUrl للعروض المقفولة إطلاقاً
export type PublicDeal = Omit<Deal, "directUrl"> & { directUrl: null };

// تُستدعى من الـ cron بعد نجاح جلب دفعة عروض حقيقية من مصدر معيّن.
// تستبدل الدفعة القديمة لنفس المصدر بالكامل، وتحذف عروض seed الوهمية
// المقفولة أول ما يتوفر بديل حقيقي واحد على الأقل.
export async function replaceSourceDeals(
  source: string,
  deals: Omit<DealRow, "updated_at">[]
) {
  await deleteDealsBySource(source);
  for (const d of deals) {
    await upsertDeal(d);
  }
  if (deals.length > 0) {
    await deleteDealsBySource("seed_locked");
  }
}

export async function getPublicDeals(): Promise<{
  free: Deal[];
  locked: PublicDeal[];
}> {
  const all = await getFullDeals();
  const free = all.filter((d) => d.free);
  const locked = all
    .filter((d) => !d.free)
    .map((d) => ({ ...d, directUrl: null as null }));
  return { free, locked };
}
