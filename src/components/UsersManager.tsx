"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth-rules";
import { ASSIGNABLE_ROLES, ROLE_LABEL } from "@/lib/roles";
import {
  approveUser,
  changeUserRole,
  fetchUsers,
  resetUserPassword,
} from "@/lib/users-actions";
import type { Role, User } from "@/lib/types";

// หน้าจัดการบัญชีผู้ใช้ของ super admin
// ทุกปุ่มเรียก server action ซึ่งตรวจสิทธิ์ที่ server อีกครั้งเสมอ
export default function UsersManager({ currentUserId }: { currentUserId: number }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // บัญชีที่กำลังเปิดกล่องรีเซ็ตรหัสผ่านอยู่
  const [resetTarget, setResetTarget] = useState<User | null>(null);

  async function reload() {
    const result = await fetchUsers();
    if (result.ok) setUsers(result.users);
    else setError(result.message);
  }

  useEffect(() => {
    fetchUsers()
      .then((result) => {
        if (result.ok) setUsers(result.users);
        else setError(result.message);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove(u: User, approved: boolean) {
    setError("");
    setMessage("");
    const result = await approveUser(u.id, approved);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(approved ? `อนุมัติบัญชี ${u.username} แล้ว` : `ปิดการใช้งานบัญชี ${u.username} แล้ว`);
    await reload();
  }

  async function handleRole(u: User, role: Role) {
    setError("");
    setMessage("");
    const result = await changeUserRole(u.id, role);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(`เปลี่ยนระดับสิทธิ์ของ ${u.username} เป็น ${ROLE_LABEL[role]} แล้ว`);
    await reload();
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-navy">จัดการผู้ใช้</h1>
          <p className="mt-1 text-ink">อนุมัติบัญชี เปลี่ยนระดับสิทธิ์ และรีเซ็ตรหัสผ่าน</p>
        </div>
        <Link
          href="/"
          className="rounded-lg px-4 py-2 text-sm font-medium text-ink ring-1 ring-line-strong hover:bg-ice"
        >
          กลับหน้าหลัก
        </Link>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-navy bg-mist p-4 text-ink-strong">{error}</div>
      )}
      {message && (
        <div className="mb-4 rounded-xl bg-tint p-4 text-brand-deep ring-1 ring-line">{message}</div>
      )}

      {loading ? (
        <div className="rounded-xl bg-white p-10 text-center text-steel shadow-sm ring-1 ring-line">
          กำลังโหลดข้อมูล...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-line">
          <table className="w-full text-sm">
            <thead className="bg-mist text-left text-ink">
              <tr>
                <th className="px-4 py-3 font-medium">ชื่อผู้ใช้</th>
                <th className="px-4 py-3 font-medium">ชื่อ-สกุล</th>
                <th className="px-4 py-3 font-medium">หน่วยงาน</th>
                <th className="px-4 py-3 font-medium">ระดับสิทธิ์</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
                <th className="px-4 py-3 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-ice">
                  <td className="whitespace-nowrap px-4 py-3 text-ink-strong">
                    {u.username}
                    {u.id === currentUserId && (
                      <span className="ml-2 rounded-full bg-tint px-2 py-0.5 text-xs text-brand-deep">
                        คุณ
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-strong">{u.full_name}</td>
                  <td className="px-4 py-3 text-ink">{u.department || "-"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRole(u, e.target.value as Role)}
                      className="rounded-lg border border-line-strong px-2 py-1 outline-none focus:border-brand"
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {u.is_approved ? (
                      <span className="rounded-full bg-azure-soft px-2.5 py-1 text-xs font-medium text-navy">
                        ใช้งานได้
                      </span>
                    ) : (
                      <span className="rounded-full bg-mist px-2.5 py-1 text-xs font-medium text-ink-strong">
                        รออนุมัติ
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      onClick={() => handleApprove(u, !u.is_approved)}
                      className="text-sm font-medium text-brand hover:underline"
                    >
                      {u.is_approved ? "ปิดการใช้งาน" : "อนุมัติ"}
                    </button>
                    {u.role !== "super_admin" && (
                      <button
                        onClick={() => setResetTarget(u)}
                        className="ml-3 text-sm font-medium text-navy hover:underline"
                      >
                        รีเซ็ตรหัสผ่าน
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resetTarget && (
        <ResetPasswordDialog
          target={resetTarget}
          onClose={() => setResetTarget(null)}
          onDone={(text) => {
            setResetTarget(null);
            setError("");
            setMessage(text);
          }}
        />
      )}
    </main>
  );
}

// กล่องรีเซ็ตรหัสผ่าน แยกออกมาเพื่อให้ล้าง state ทุกครั้งที่เปิดใหม่
function ResetPasswordDialog({
  target,
  onClose,
  onDone,
}: {
  target: User;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);

    const result = await resetUserPassword(target.id, password, confirmPassword);
    setBusy(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    onDone(`รีเซ็ตรหัสผ่านของ ${target.username} แล้ว กรุณาแจ้งรหัสใหม่ให้เจ้าของบัญชี`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-6" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg ring-1 ring-line"
      >
        <h2 className="text-lg font-semibold text-navy">รีเซ็ตรหัสผ่าน</h2>
        <p className="mt-2 text-sm text-ink">
          บัญชี <span className="font-medium text-ink-strong">{target.username}</span> ·{" "}
          {target.full_name}
        </p>

        <div className="mt-4 space-y-4">
          <PasswordInput
            label="รหัสผ่านใหม่"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />
          <PasswordInput
            label="ยืนยันรหัสผ่านใหม่"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />
          <p className="text-xs text-steel">ยาวอย่างน้อย {PASSWORD_MIN_LENGTH} ตัวอักษร</p>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-navy bg-mist px-3 py-2 text-sm text-ink-strong">
            {error}
          </p>
        )}

        <p className="mt-4 text-xs text-steel">
          หมายเหตุ: ถ้าเจ้าของบัญชีกำลังใช้งานอยู่ เขาจะยังใช้งานต่อได้จนออกจากระบบเองหรือครบครึ่งชั่วโมง
          รหัสใหม่มีผลกับการเข้าสู่ระบบครั้งถัดไป
        </p>

        <div className="mt-5 flex gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-deep disabled:bg-steel-light"
          >
            {busy ? "กำลังบันทึก..." : "รีเซ็ตรหัสผ่าน"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-5 py-2.5 font-medium text-ink ring-1 ring-line-strong hover:bg-ice"
          >
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
}
