import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/lemonsqueezy";
import { upsertSubscriber } from "@/lib/db";

// Lemon Squeezy يرسل أحداث الاشتراك (subscription_created, subscription_updated,
// subscription_cancelled, subscription_expired ...) — نتعامل معها كلها بنفس المنطق:
// نحدّث حالة المشترك بقاعدة البيانات.

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");

  const isValid = await verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    // لا نطبع أي تفاصيل حساسة بالـ logs
    console.error("webhook: invalid signature");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const eventName: string = payload?.meta?.event_name || "";
  const attrs = payload?.data?.attributes;

  if (!attrs) {
    return NextResponse.json({ error: "missing attributes" }, { status: 400 });
  }

  const email: string | undefined = attrs.user_email;
  const subscriptionId: string = String(payload?.data?.id ?? "");
  const status: string = attrs.status; // active, cancelled, expired, past_due, on_trial ...
  const renewsAt: string | null = attrs.renews_at ?? null;

  if (!email || !subscriptionId) {
    return NextResponse.json({ error: "missing subscriber data" }, { status: 400 });
  }

  // نطبّع الحالة لثلاث حالات نهتم فيها فقط
  let normalizedStatus: "active" | "cancelled" | "expired" | "past_due" = "expired";
  if (status === "active" || status === "on_trial") normalizedStatus = "active";
  else if (status === "cancelled") normalizedStatus = "cancelled";
  else if (status === "past_due") normalizedStatus = "past_due";
  else normalizedStatus = "expired";

  try {
    await upsertSubscriber({
      email,
      subscription_id: subscriptionId,
      status: normalizedStatus,
      renews_at: renewsAt,
    });
  } catch (err) {
    console.error("webhook: db error");
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }

  // نسجل فقط اسم الحدث للمتابعة، بدون أي بيانات شخصية
  console.log(`webhook processed: ${eventName}`);

  return NextResponse.json({ received: true }, { status: 200 });
}
