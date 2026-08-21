"use client";

import { useState } from "react";
import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";
import { register } from "@/lib/auth-actions";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth-rules";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);

    const result = await register({ username, password, confirmPassword, fullName, department });
    setBusy(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    setDone(true);
  }

  // สมัครเสร็จแล้ว — บอกให้รอผู้ดูแลอนุมัติ ยังเข้าใช้งานไม่ได้
  if (done) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-line">
          <h2 className="text-lg font-semibold text-navy">ลงทะเบียนสำเร็จ</h2>
          <p className="mt-3 text-ink-strong">
            บัญชี <span className="font-medium text-navy">{username}</span> ถูกสร้างแล้ว
            แต่ยังเข้าใช้งานไม่ได้จนกว่าผู้ดูแลระบบจะอนุมัติ
          </p>
          <p className="mt-2 text-sm text-ink">
            กรุณาติดต่อผู้ดูแลระบบเพื่อขออนุมัติ แล้วกลับมาเข้าสู่ระบบอีกครั้ง
          </p>
          <Link
            href="/login"
            className="mt-5 block w-full rounded-lg bg-brand px-5 py-2.5 text-center font-medium text-white hover:bg-brand-deep"
          >
            ไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-navy">MyExpense</h1>
        <p className="mt-1 text-ink">บันทึกรายจ่ายส่วนตัว</p>
      </header>

      <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-line">
        <h2 className="mb-4 text-lg font-semibold text-navy">ลงทะเบียนผู้ใช้ใหม่</h2>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-strong">ชื่อผู้ใช้</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="เช่น somchai.j"
              autoComplete="username"
              className="w-full rounded-lg border border-line-strong px-3 py-2 outline-none focus:border-brand"
            />
            <span className="mt-1 block text-xs text-steel">
              ใช้ได้เฉพาะ a-z A-Z 0-9 จุด ขีดกลาง และขีดล่าง
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-strong">ชื่อ-สกุล</span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="เช่น สมชาย ใจดี"
              className="w-full rounded-lg border border-line-strong px-3 py-2 outline-none focus:border-brand"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-strong">หน่วยงาน</span>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="เช่น ฝ่ายบัญชี (ไม่ระบุก็ได้)"
              className="w-full rounded-lg border border-line-strong px-3 py-2 outline-none focus:border-brand"
            />
          </label>

          <PasswordInput
            label="รหัสผ่าน"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />
          <span className="-mt-2 block text-xs text-steel">
            ยาวอย่างน้อย {PASSWORD_MIN_LENGTH} ตัวอักษร
          </span>

          <PasswordInput
            label="ยืนยันรหัสผ่าน"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />
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
          {busy ? "กำลังลงทะเบียน..." : "ลงทะเบียน"}
        </button>

        <p className="mt-4 text-center text-sm text-ink">
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </form>
    </main>
  );
}
