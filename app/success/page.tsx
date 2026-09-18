import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="max-w-md mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold mb-3">تم الاشتراك بنجاح ✅</h1>
      <p className="text-neutral-600 mb-6">
        قد تستغرق معالجة الاشتراك بضع ثوانٍ. ارجع للصفحة الرئيسية وأدخل نفس
        البريد الإلكتروني اللي استخدمته بالدفع للتحقق من اشتراكك ومشاهدة
        القائمة الكاملة.
      </p>
      <Link
        href="/"
        className="inline-block bg-neutral-800 text-white rounded-lg px-5 py-3"
      >
        الرجوع للصفحة الرئيسية
      </Link>
    </main>
  );
}
