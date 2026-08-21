"use client";

import { useState } from "react";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
};

// ช่องกรอกรหัสผ่านที่ปิดบังตัวอักษรไว้ และกดปุ่มเพื่อดูรหัสจริงได้
// ใช้ร่วมกันทั้งหน้าเข้าสู่ระบบ หน้าสมัคร และหน้ารีเซ็ตรหัสผ่านของ super admin
export default function PasswordInput({
  label,
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete = "current-password",
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-strong">{label}</span>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-lg border border-line-strong px-3 py-2 pr-20 outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          // aria-pressed ช่วยให้โปรแกรมอ่านหน้าจอรู้ว่าปุ่มนี้กำลังเปิดหรือปิดอยู่
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-brand hover:text-brand-deep"
        >
          {visible ? "ซ่อน" : "ดู"}
        </button>
      </div>
    </label>
  );
}
