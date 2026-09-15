import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DealUnlock — أقوى الخصومات الحقيقية يومياً",
  description:
    "اشترك واحصل على قائمة يومية مُنسّقة ومُتحقق منها من أقوى الخصومات على Amazon و AliExpress و Shein و Booking.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-neutral-50 text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
