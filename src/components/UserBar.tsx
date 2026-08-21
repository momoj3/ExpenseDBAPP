"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth-actions";
import { ROLE_LABEL, canManageUsers } from "@/lib/roles";
import type { SessionUser } from "@/lib/types";

// แถบบอกว่าใครกำลังใช้งาน พร้อมเมนูผู้ดูแลระบบและปุ่มออกจากระบบ
export default function UserBar({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    await logout();
    router.push("/login");
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-line">
      <div>
        <p className="font-medium text-navy">คุณ{user.fullName}</p>
        <p className="text-sm text-ink">
          {user.username} · {ROLE_LABEL[user.role]}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {canManageUsers(user.role) && (
          <>
            <Link
              href="/admin/users"
              className="rounded-lg px-4 py-2 text-sm font-medium text-ink ring-1 ring-line-strong hover:bg-ice"
            >
              จัดการผู้ใช้
            </Link>
            <Link
              href="/admin/logs"
              className="rounded-lg px-4 py-2 text-sm font-medium text-ink ring-1 ring-line-strong hover:bg-ice"
            >
              ประวัติการเข้าระบบ
            </Link>
          </>
        )}
        <button
          onClick={handleLogout}
          disabled={busy}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-soft disabled:bg-steel-light"
        >
          {busy ? "กำลังออก..." : "ออกจากระบบ"}
        </button>
      </div>
    </div>
  );
}
