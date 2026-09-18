import { NextRequest, NextResponse } from "next/server";
import { getSubscriberByEmail, isActiveSubscriber } from "@/lib/db";
import { getFullDeals } from "@/lib/deals-service";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ active: false, error: "email required" }, { status: 400 });
    }

    const subscriber = await getSubscriberByEmail(email);
    const active = isActiveSubscriber(subscriber);

    if (!active) {
      return NextResponse.json({ active: false });
    }

    // مشترك فعّال → نرجّع القائمة الكاملة بالروابط المباشرة
    const deals = await getFullDeals();
    return NextResponse.json({ active: true, deals });
  } catch (err) {
    console.error("check-subscription error");
    return NextResponse.json({ active: false, error: "server error" }, { status: 500 });
  }
}
