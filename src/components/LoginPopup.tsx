"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ROLE_LABEL } from "@/lib/roles";
import type { SessionUser } from "@/lib/types";

// popup แจ้งว่าใครเข้าสู่ระบบ แสดงหลังเข้าสู่ระบบสำเร็จ
// หน้า login จะพามาที่ /?welcome=1 popup จึงอ่านเงื่อนไขจากพารามิเตอร์นี้
//
// คำนวณสถานะเปิด/ปิดจากค่าที่มีอยู่แล้วตรง ๆ ไม่ใช้ useEffect + setState
// เพราะการ setState ใน effect ทำให้ render ซ้ำซ้อนโดยไม่จำเป็น
export default function LoginPopup({ user }: { user: SessionUser }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [dismissed, setDismissed] = useState(false);

  const open = params.get("welcome") === "1" && !dismissed;

  function close() {
    setDismissed(true);
    // ลบพารามิเตอร์ออกจาก URL เพื่อให้กด refresh แล้ว popup ไม่ขึ้นซ้ำ
    router.replace(pathname);
  }

  if (!open) return null;

  return (
    // พื้นหลังทึบคลิกแล้วปิด popup ได้
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-6"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg ring-1 ring-line"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-navy">เข้าสู่ระบบสำเร็จ</h2>
        <p className="mt-3 text-ink-strong">
          ยินดีต้อนรับ คุณ<span className="font-medium text-navy">{user.fullName}</span>
        </p>
        <dl className="mt-3 space-y-1 text-sm text-ink">
          <div className="flex gap-2">
            <dt>ชื่อผู้ใช้:</dt>
            <dd className="text-ink-strong">{user.username}</dd>
          </div>
          <div className="flex gap-2">
            <dt>ระดับสิทธิ์:</dt>
            <dd className="text-ink-strong">{ROLE_LABEL[user.role]}</dd>
          </div>
        </dl>
        <button
          onClick={close}
          className="mt-5 w-full rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-deep"
        >
          เริ่มใช้งาน
        </button>
      </div>
    </div>
  );
}
