import { NextRequest, NextResponse } from "next/server";
import { createSubscriptionCheckout } from "@/lib/lemonsqueezy";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email: string | undefined = body?.email;

    // لا نسجل بيانات شخصية بالـ logs — فقط نتابع نجاح/فشل العملية
    const url = await createSubscriptionCheckout(email);

    return NextResponse.json({ url });
  } catch (err) {
    console.error("checkout error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { error: "تعذّر إنشاء جلسة الدفع، حاول مرة أخرى لاحقاً." },
      { status: 500 }
    );
  }
}
