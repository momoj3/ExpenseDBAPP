"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PasswordInput from "@/components/PasswordInput";
import { login } from "@/lib/auth-actions";

// useSearchParams ต้องอยู่ใน Suspense ไม่งั้น Next.js จะ build ไม่ผ่าน
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // ถูกเด้งออกเพราะไม่มีการเคลื่อนไหว proxy หรือ IdleLogout ส่งพารามิเตอร์นี้มา
  const idle = params.get("reason") === "idle";
  const nextPath = params.get("next") ?? "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);

    const result = await login(username, password);
    if (!result.ok) {
      setError(result.message);
      setBusy(false);
      return;
    }

    // welcome=1 ทำให้หน้าแรกแสดง popup บอกว่าใครเข้าสู่ระบบ
    const target = nextPath.startsWith("/") ? nextPath : "/";
    router.push(`${target}${target.includes("?") ? "&" : "?"}welcome=1`);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-navy">MyExpense</h1>
        <p className="mt-1 text-ink">บันทึกรายจ่ายส่วนตัว</p>
      </header>

      <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-line">
        <h2 className="mb-4 text-lg font-semibold text-navy">เข้าสู่ระบบ</h2>

        {idle && (
          <p className="mb-4 rounded-lg border border-navy bg-mist px-3 py-2 text-sm text-ink-strong">
            ออกจากระบบอัตโนมัติเพราะไม่มีการใช้งานเกินครึ่งชั่วโมง กรุณาเข้าสู่ระบบอีกครั้ง
          </p>
        )}

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-strong">ชื่อผู้ใช้</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full rounded-lg border border-line-strong px-3 py-2 outline-none focus:border-brand"
            />
          </label>

          <PasswordInput label="รหัสผ่าน" value={password} onChange={setPassword} />
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-navy bg-mist px-3 py-2 text-sm text-ink-strong">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 w-full rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-deep disabled:bg-steel-light"
        >
          {busy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>

        <p className="mt-4 text-center text-sm text-ink">
          ยังไม่มีบัญชี?{" "}
          <Link href="/register" className="font-medium text-brand hover:underline">
            ลงทะเบียนผู้ใช้ใหม่
          </Link>
        </p>
      </form>
    </main>
  );
}
