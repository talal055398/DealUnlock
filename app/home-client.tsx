"use client";

import { useState } from "react";
import type { Deal } from "@/lib/deals";
import type { PublicDeal } from "@/lib/deals-service";

export default function HomeClient({
  freeDeals,
  lockedDeals,
}: {
  freeDeals: Deal[];
  lockedDeals: PublicDeal[];
}) {
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlockedDeals, setUnlockedDeals] = useState<Deal[] | null>(null);

  async function handleCheckSubscription() {
    if (!email) {
      setError("أدخل بريدك الإلكتروني أولاً");
      return;
    }
    setError(null);
    setChecking(true);
    try {
      const res = await fetch("/api/check-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (json.active) {
        setUnlockedDeals(json.deals);
      } else {
        setError(
          "لا يوجد اشتراك فعّال بهذا البريد. اشترك بالأسفل للوصول للقائمة الكاملة."
        );
      }
    } catch {
      setError("حدث خطأ أثناء التحقق، حاول مرة أخرى.");
    } finally {
      setChecking(false);
    }
  }

  async function handleSubscribe() {
    setError(null);
    setSubscribing(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        setError(json.error || "تعذّر إنشاء جلسة الدفع.");
      }
    } catch {
      setError("حدث خطأ أثناء إنشاء جلسة الدفع.");
    } finally {
      setSubscribing(false);
    }
  }

  const isUnlocked = !!unlockedDeals;
  const lockedFull: (Deal | PublicDeal)[] = unlockedDeals ?? lockedDeals;

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <header className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">DealUnlock</h1>
        <p className="text-neutral-600">
          قائمة مُحدَّثة بانتظام ومُتحقق منها من أقوى الخصومات الحقيقية على
          Amazon، AliExpress، Shein، وBooking.
        </p>
      </header>

      <section className="bg-white border rounded-xl p-5 mb-10">
        <h2 className="font-semibold mb-2">وش بتاخذ بالضبط؟</h2>
        <ul className="text-sm text-neutral-700 space-y-1 list-disc pr-5">
          <li>اشتراك شهري $10 — يلغى في أي وقت.</li>
          <li>قائمة تُحدَّث بانتظام بأقوى الخصومات المُتحقق منها.</li>
          <li>ضمان استرجاع كامل لو أي خصم بالقائمة طلع غير صحيح أو منتهي.</li>
          <li>جرّب أولاً: تحت عندك عينة مجانية كاملة بدون أي دفع.</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">عينة مجانية 🎁</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {freeDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} locked={false} />
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">
          {isUnlocked ? "قائمتك الكاملة ✅" : "القائمة الكاملة 🔒"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {lockedFull.map((deal) => (
            <DealCard key={deal.id} deal={deal} locked={!isUnlocked} />
          ))}
        </div>
      </section>

      {!isUnlocked && (
        <section className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold mb-3">عندك اشتراك فعّال؟</h2>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input
              type="email"
              placeholder="بريدك الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              dir="ltr"
            />
            <button
              onClick={handleCheckSubscription}
              disabled={checking}
              className="bg-neutral-800 text-white text-sm rounded-lg px-4 py-2 disabled:opacity-50"
            >
              {checking ? "جاري التحقق..." : "تحقق من اشتراكي"}
            </button>
          </div>

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <button
            onClick={handleSubscribe}
            disabled={subscribing}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg px-4 py-3 disabled:opacity-50"
          >
            {subscribing ? "جاري التحويل..." : "اشترك الآن — $10/شهرياً"}
          </button>
        </section>
      )}
    </main>
  );
}

function DealCard({
  deal,
  locked,
}: {
  deal: Deal | PublicDeal;
  locked: boolean;
}) {
  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <img
        src={deal.imageUrl}
        alt={deal.title}
        className={`w-full h-40 object-cover ${locked ? "blur-sm" : ""}`}
      />
      <div className="p-4">
        <p className="text-xs text-neutral-500 mb-1">{deal.store}</p>
        <h3 className="font-medium mb-2">{deal.title}</h3>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-neutral-400 line-through text-sm">
            ${deal.originalPrice}
          </span>
          <span className="text-green-600 font-bold">
            ${deal.discountedPrice}
          </span>
        </div>

        {locked || !deal.directUrl ? (
          <span className="text-xs text-neutral-400">
            🔒 يظهر الرابط للمشتركين فقط
          </span>
        ) : (
          <a
            href={deal.directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 underline"
          >
            الذهاب للعرض ↗
          </a>
        )}
      </div>
    </div>
  );
}
