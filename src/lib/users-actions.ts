"use server";

import { hash } from "bcryptjs";
import { BCRYPT_ROUNDS, validateNewPassword } from "./auth-rules";
import { canManageUsers, canResetPasswordOf } from "./roles";
import { requireSessionUser } from "./session";
import {
  getUserById,
  listLoginLogs,
  listUsers,
  setUserApproved,
  setUserPasswordHash,
  setUserRole,
  writeLoginLog,
} from "./supabase";
import type { LoginLog, Role, User } from "./types";

// การจัดการบัญชีผู้ใช้ — super admin เท่านั้น
// ทุกฟังก์ชันตรวจสิทธิ์จาก session ที่ server ก่อนทำงานทุกครั้ง
// ห้ามเชื่อว่า client ซ่อนปุ่มไว้แล้วจะไม่มีใครเรียก action นี้ตรง ๆ

export type UsersResult = { ok: true; users: User[] } | { ok: false; message: string };
export type LogsResult = { ok: true; logs: LoginLog[] } | { ok: false; message: string };
export type ManageResult = { ok: true } | { ok: false; message: string };

const NO_PERMISSION = "คุณไม่มีสิทธิ์จัดการบัญชีผู้ใช้";

export async function fetchUsers(): Promise<UsersResult> {
  try {
    const actor = await requireSessionUser();
    if (!canManageUsers(actor.role)) return { ok: false, message: NO_PERMISSION };
    return { ok: true, users: await listUsers() };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function fetchLoginLogs(): Promise<LogsResult> {
  try {
    const actor = await requireSessionUser();
    if (!canManageUsers(actor.role)) return { ok: false, message: NO_PERMISSION };
    return { ok: true, logs: await listLoginLogs() };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function approveUser(userId: number, approved: boolean): Promise<ManageResult> {
  try {
    const actor = await requireSessionUser();
    if (!canManageUsers(actor.role)) return { ok: false, message: NO_PERMISSION };

    // ห้ามปิดบัญชีตัวเอง ไม่งั้นจะล็อกตัวเองออกจากระบบจัดการบัญชี
    if (userId === actor.userId && !approved) {
      return { ok: false, message: "ปิดการใช้งานบัญชีของตัวเองไม่ได้" };
    }

    await setUserApproved(userId, approved);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function changeUserRole(userId: number, role: Role): Promise<ManageResult> {
  try {
    const actor = await requireSessionUser();
    if (!canManageUsers(actor.role)) return { ok: false, message: NO_PERMISSION };

    // ห้ามลดระดับสิทธิ์ของตัวเอง กันกรณีเผลอทำให้ไม่มี super admin เหลืออยู่
    if (userId === actor.userId && role !== "super_admin") {
      return { ok: false, message: "ลดระดับสิทธิ์ของตัวเองไม่ได้" };
    }

    await setUserRole(userId, role);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

// รีเซ็ตรหัสผ่านให้บัญชีอื่น — ทำได้เฉพาะบัญชี admin และ user
// เพื่อไม่ให้ super admin ยึดบัญชีของ super admin คนอื่น
export async function resetUserPassword(
  userId: number,
  newPassword: string,
  confirmPassword: string
): Promise<ManageResult> {
  try {
    const actor = await requireSessionUser();
    if (!canManageUsers(actor.role)) return { ok: false, message: NO_PERMISSION };

    const target = await getUserById(userId);
    if (!target) return { ok: false, message: "ไม่พบบัญชีที่ต้องการรีเซ็ตรหัสผ่าน" };

    if (!canResetPasswordOf(actor.role, target.role)) {
      return {
        ok: false,
        message: "รีเซ็ตรหัสผ่านของผู้ดูแลระบบสูงสุดคนอื่นไม่ได้ ทำได้เฉพาะบัญชีผู้ดูแลระบบและผู้ใช้งาน",
      };
    }

    const passwordError = validateNewPassword(newPassword, confirmPassword);
    if (passwordError) return { ok: false, message: passwordError };

    await setUserPasswordHash(userId, await hash(newPassword, BCRYPT_ROUNDS));
    await writeLoginLog({
      userId: target.id,
      username: target.username,
      action: "password_reset",
      detail: `รีเซ็ตรหัสผ่านโดย ${actor.username}`,
    });

    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
