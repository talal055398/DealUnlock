// lib/sources/aliexpress.ts
// جلب عروض حقيقية تلقائياً من AliExpress Affiliate API (aliexpress.affiliate.hotproduct.query).
//
// ⚠️ مهم: هذا الملف يفترض شكل الـ API الموثّق حالياً على open.aliexpress.com.
// منصات الشركاء (Open Platform APIs) تتغيّر أحياناً بدون سابق إنذار —
// تأكد من مطابقة أسماء الحقول مع لوحة تحكم AliExpress قبل أول تشغيل فعلي،
// وراقب أول تنفيذ عبر vercel logs.
//
// المتطلبات (تحصل عليها من https://portals.aliexpress.com بعد التقديم — عادة
// يوم إلى يومين للموافقة، بدون شرط مبيعات مسبقة):
//   ALIEXPRESS_APP_KEY
//   ALIEXPRESS_APP_SECRET
//   ALIEXPRESS_TRACKING_ID   (معرّف التتبع الخاص بحسابك كـ Affiliate)

import crypto from "crypto";
import type { DealRow } from "@/lib/db";

const GATEWAY = "https://api-sg.aliexpress.com/sync";

function sign(params: Record<string, string>, secret: string): string {
  const sorted = Object.keys(params).sort();
  const concatenated = sorted.map((k) => `${k}${params[k]}`).join("");
  const raw = secret + concatenated + secret;
  return crypto.createHash("md5").update(raw, "utf8").digest("hex").toUpperCase();
}

function timestampNow(): string {
  // التوقيت المطلوب بصيغة yyyy-MM-dd HH:mm:ss بتوقيت GMT+8 حسب توثيق المنصة
  const d = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(
    d.getUTCHours()
  )}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

export async function fetchAliExpressDeals(limit = 12): Promise<Omit<DealRow, "updated_at">[]> {
  const appKey = process.env.ALIEXPRESS_APP_KEY;
  const appSecret = process.env.ALIEXPRESS_APP_SECRET;
  const trackingId = process.env.ALIEXPRESS_TRACKING_ID;

  if (!appKey || !appSecret || !trackingId) {
    // المصدر غير مفعّل بعد — لا نرمي خطأ، فقط نرجّع قائمة فاضية
    return [];
  }

  const baseParams: Record<string, string> = {
    app_key: appKey,
    method: "aliexpress.affiliate.hotproduct.query",
    timestamp: timestampNow(),
    format: "json",
    v: "2.0",
    sign_method: "md5",
    tracking_id: trackingId,
    page_no: "1",
    page_size: String(limit),
    target_currency: "USD",
    target_language: "EN",
    ship_to_country: "US",
  };

  const signature = sign(baseParams, appSecret);
  const query = new URLSearchParams({ ...baseParams, sign: signature });

  const res = await fetch(`${GATEWAY}?${query.toString()}`, { method: "GET" });
  if (!res.ok) {
    throw new Error(`AliExpress API error: ${res.status}`);
  }

  const json: any = await res.json();
  const products: any[] =
    json?.aliexpress_affiliate_hotproduct_query_response?.resp_result?.result
      ?.products?.product ?? [];

  return products.map((p, i) => {
    const original = Number(p.original_price ?? p.app_sale_price ?? 0);
    const sale = Number(p.target_sale_price ?? p.app_sale_price ?? original);
    return {
      id: `aliexpress-${p.product_id ?? i}`,
      title: String(p.product_title ?? "AliExpress Deal").slice(0, 140),
      store: "AliExpress",
      original_price: original || sale,
      discounted_price: sale,
      currency: "USD",
      image_url: p.product_main_image_url ?? "",
      direct_url: p.promotion_link ?? p.product_detail_url ?? "",
      is_free: false,
      source: "aliexpress",
    };
  });
}
