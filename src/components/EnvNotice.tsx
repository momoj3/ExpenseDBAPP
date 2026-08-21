import { missingEnvVars } from "@/lib/supabase";

// หน้าบอกวิธีตั้งค่าเมื่อ environment variable ยังไม่ครบ
// แสดงแทนหน้าแอป เพื่อไม่ให้ผู้ใช้เจอจอขาวหรือจอ error
export default function EnvNotice() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-navy">MyExpense</h1>
        <p className="mt-1 text-ink">บันทึกรายจ่ายส่วนตัว</p>
      </header>

      <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-line">
        <h2 className="text-lg font-semibold text-navy">ยังตั้งค่าระบบไม่ครบ</h2>
        <p className="mt-3 text-ink-strong">
          แอปยังไม่พบค่าที่ใช้เชื่อมต่อฐานข้อมูลหรือค่าที่ใช้เข้ารหัส session
          จึงยังเข้าสู่ระบบและบันทึกรายจ่ายไม่ได้
        </p>
        <p className="mt-4 text-ink-strong">
          กรุณาเพิ่มค่าต่อไปนี้ในไฟล์{" "}
          <code className="rounded bg-mist px-1.5 py-0.5 text-sm">.env.local</code>{" "}
          ที่โฟลเดอร์บนสุดของโปรเจกต์
        </p>
        <ul className="mt-3 space-y-1.5">
          {missingEnvVars.map((name) => (
            <li key={name} className="text-ink-strong">
              <code className="rounded bg-mist px-1.5 py-0.5 text-sm">{name}</code>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-ink">
          ดูชื่อตัวแปรทั้งหมดได้จากไฟล์{" "}
          <code className="rounded bg-mist px-1.5 py-0.5 text-sm">.env.local.example</code> ·{" "}
          <code className="rounded bg-mist px-1.5 py-0.5 text-sm">SUPABASE_SECRET_KEY</code>{" "}
          คัดลอกได้จากหน้า Project Settings → API ของ Supabase (เลือก secret key ไม่ใช่ publishable
          key) ·{" "}
          <code className="rounded bg-mist px-1.5 py-0.5 text-sm">SESSION_SECRET</code>{" "}
          ให้สุ่มข้อความยาวอย่างน้อย 32 ตัวอักษรขึ้นมาเอง
        </p>
        <p className="mt-4 text-steel">
          ตั้งค่าแล้วต้องปิดและเปิดเซิร์ฟเวอร์ใหม่ (
          <code className="text-sm">npm run dev</code>) เพราะ Next.js อ่านค่าเหล่านี้ตอนเริ่มทำงาน
        </p>
      </div>
    </main>
  );
}
