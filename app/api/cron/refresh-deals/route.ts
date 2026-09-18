import { NextRequest, NextResponse } from "next/server";
import { fetchAliExpressDeals } from "@/lib/sources/aliexpress";
import { replaceSourceDeals } from "@/lib/deals-service";

// يستدعيها Vercel Cron تلقائياً حسب الجدول في vercel.json.
// Vercel يضيف تلقائياً الهيدر: Authorization: Bearer <CRON_SECRET>
// لازم تحط نفس القيمة بمتغيرات البيئة (CRON_SECRET) — بدونها أي حد يقدر يستدعي
// هذا الرابط ويستهلك حصتك من طلبات AliExpress.

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results: Record<string, number | string> = {};

  try {
    const aliexpressDeals = await fetchAliExpressDeals(12);
    await replaceSourceDeals("aliexpress", aliexpressDeals);
    results.aliexpress = aliexpressDeals.length;
  } catch (err) {
    results.aliexpress = `error: ${err instanceof Error ? err.message : "unknown"}`;
  }

  // أضف مصادر ثانية هنا لاحقاً (Amazon PA-API بعد تأهيلك، Awin/CJ feeds لـ Shein/Booking، إلخ)
  // بنفس النمط: fetchX() ثم replaceSourceDeals("x", ...)

  return NextResponse.json({ ok: true, results, ranAt: new Date().toISOString() });
}
