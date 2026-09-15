// lib/lemonsqueezy.ts
// Helper بسيط للتعامل مع Lemon Squeezy API — بدون SDK إضافي، fetch مباشر.

const LS_API_BASE = "https://api.lemonsqueezy.com/v1";

function headers() {
  return {
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
    Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
  };
}

// إنشاء جلسة Checkout لاشتراك شهري (subscription variant)
export async function createSubscriptionCheckout(email?: string) {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;

  if (!storeId || !variantId) {
    throw new Error("LEMONSQUEEZY_STORE_ID أو LEMONSQUEEZY_VARIANT_ID غير معرّفة");
  }

  const body = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: email ? { email } : {},
        product_options: {
          redirect_url: `${process.env.NEXT_PUBLIC_URL}/success`,
        },
      },
      relationships: {
        store: {
          data: { type: "stores", id: storeId },
        },
        variant: {
          data: { type: "variants", id: variantId },
        },
      },
    },
  };

  const res = await fetch(`${LS_API_BASE}/checkouts`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`فشل إنشاء جلسة الدفع: ${res.status} ${errText}`);
  }

  const json = await res.json();
  const checkoutUrl: string = json.data.attributes.url;
  return checkoutUrl;
}

// التحقق من توقيع الـ Webhook باستخدام HMAC SHA256
export async function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): Promise<boolean> {
  if (!signatureHeader) return false;

  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return false;

  const crypto = await import("crypto");
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");

  const sigBuffer = Buffer.from(signatureHeader, "utf8");
  const digestBuffer = Buffer.from(digest, "utf8");

  if (sigBuffer.length !== digestBuffer.length) return false;

  return crypto.timingSafeEqual(digestBuffer, sigBuffer);
}
