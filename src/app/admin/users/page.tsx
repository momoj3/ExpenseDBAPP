import { redirect } from "next/navigation";
import UsersManager from "@/components/UsersManager";
import { canManageUsers } from "@/lib/roles";
import { getSessionUser } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase";
import EnvNotice from "@/components/EnvNotice";
import NoPermission from "@/components/NoPermission";

export default async function AdminUsersPage() {
  if (!isSupabaseConfigured) return <EnvNotice />;

  const user = await getSessionUser();
  if (!user) redirect("/login");

  // ตรวจสิทธิ์ที่ server ไม่ใช่แค่ซ่อนลิงก์ในเมนู
  if (!canManageUsers(user.role)) return <NoPermission />;

  return <UsersManager currentUserId={user.userId} />;
}
