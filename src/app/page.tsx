import { Suspense } from "react";
import { redirect } from "next/navigation";
import EnvNotice from "@/components/EnvNotice";
import ExpenseApp from "@/components/ExpenseApp";
import IdleLogout from "@/components/IdleLogout";
import LoginPopup from "@/components/LoginPopup";
import UserBar from "@/components/UserBar";
import { getSessionUser } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase";

// หน้านี้เป็น server component เพื่ออ่าน session cookie ได้
// ส่วนที่ผู้ใช้กดโต้ตอบอยู่ใน ExpenseApp ซึ่งเป็น client component
export default async function Home() {
  // ยังตั้งค่า environment variable ไม่ครบ — บอกวิธีตั้งค่า ไม่ปล่อยให้หน้าเว็บพัง
  if (!isSupabaseConfigured) return <EnvNotice />;

  // proxy.ts กันไว้อีกชั้นแล้ว แต่ตรวจซ้ำที่นี่ด้วยเพราะห้ามพึ่ง proxy เป็นด่านเดียว
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-navy">MyExpense</h1>
        <p className="mt-1 text-ink">บันทึกรายจ่ายส่วนตัว</p>
      </header>

      <UserBar user={user} />
      <IdleLogout />

      {/* LoginPopup อ่านพารามิเตอร์จาก URL จึงต้องอยู่ใน Suspense */}
      <Suspense fallback={null}>
        <LoginPopup user={user} />
      </Suspense>

      <ExpenseApp user={user} />
    </main>
  );
}
