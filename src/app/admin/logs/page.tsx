import Link from "next/link";
import { redirect } from "next/navigation";
import EnvNotice from "@/components/EnvNotice";
import NoPermission from "@/components/NoPermission";
import { canManageUsers } from "@/lib/roles";
import { getSessionUser } from "@/lib/session";
import { isSupabaseConfigured, listLoginLogs } from "@/lib/supabase";
import type { LoginLog } from "@/lib/types";

// ชื่อเหตุการณ์ภาษาไทย
const ACTION_LABEL: Record<LoginLog["action"], string> = {
  login: "เข้าสู่ระบบ",
  logout: "ออกจากระบบ",
  failed: "เข้าไม่สำเร็จ",
  password_reset: "รีเซ็ตรหัสผ่าน",
};

// สีป้ายกำกับ ใช้เฉพาะ token ที่ประกาศไว้ และไม่ใช้โทนอุ่น
const ACTION_STYLE: Record<LoginLog["action"], string> = {
  login: "bg-azure-soft text-navy",
  logout: "bg-mist text-ink",
  failed: "bg-navy text-white",
  password_reset: "bg-zest-soft text-zest-ink",
};

// แสดงเวลาเป็นรูปแบบไทย
function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminLogsPage() {
  if (!isSupabaseConfigured) return <EnvNotice />;

  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!canManageUsers(user.role)) return <NoPermission />;

  // หน้านี้เป็น server component จึงอ่านฐานข้อมูลได้ตรง ไม่ต้องผ่าน action
  const logs = await listLoginLogs();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-navy">ประวัติการเข้าระบบ</h1>
          <p className="mt-1 text-ink">แสดง {logs.length} เหตุการณ์ล่าสุด</p>
        </div>
        <Link
          href="/"
          className="rounded-lg px-4 py-2 text-sm font-medium text-ink ring-1 ring-line-strong hover:bg-ice"
        >
          กลับหน้าหลัก
        </Link>
      </header>

      {logs.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center text-steel shadow-sm ring-1 ring-line">
          ยังไม่มีประวัติการเข้าระบบ
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-line">
          <table className="w-full text-sm">
            <thead className="bg-mist text-left text-ink">
              <tr>
                <th className="px-4 py-3 font-medium">เวลา</th>
                <th className="px-4 py-3 font-medium">ชื่อผู้ใช้</th>
                <th className="px-4 py-3 font-medium">เหตุการณ์</th>
                <th className="px-4 py-3 font-medium">รายละเอียด</th>
                <th className="px-4 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-ice">
                  <td className="whitespace-nowrap px-4 py-3 text-ink-strong">
                    {formatTime(log.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-strong">{log.username}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${ACTION_STYLE[log.action]}`}
                    >
                      {ACTION_LABEL[log.action]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink">{log.detail || "-"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink">{log.ip || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
