import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

// ฟอนต์เริ่มต้นของ Next.js คือ Geist ซึ่งไม่รองรับภาษาไทย
// จึงเปลี่ยนมาใช้ Noto Sans Thai เพื่อให้ข้อความภาษาไทยอ่านง่าย
const notoThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MyExpense — บันทึกรายจ่ายส่วนตัว",
  description: "แอปบันทึกรายจ่ายส่วนตัวที่สร้างด้วย Claude Code",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${notoThai.variable} h-full antialiased`}>
      <body className="min-h-full bg-ice">{children}</body>
    </html>
  );
}
