import type { Role } from "./types";

// แหล่งเดียวของกฎสิทธิ์ทั้งแอป — ห้ามเช็ก role ด้วยการเทียบสตริงที่อื่น
// ไฟล์นี้ไม่มี "use server" เพราะใช้ได้ทั้งฝั่ง server และ client (ไม่แตะฐานข้อมูล)

// ชื่อระดับสิทธิ์ภาษาไทย ใช้แสดงบนหน้าจอ
export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "ผู้ดูแลระบบสูงสุด",
  admin: "ผู้ดูแลระบบ",
  user: "ผู้ใช้งาน",
};

// ระดับสิทธิ์ที่ super admin เลือกตั้งให้คนอื่นได้
export const ASSIGNABLE_ROLES: Role[] = ["super_admin", "admin", "user"];

// ดูและแก้รายจ่ายของทุกคนได้ (รวมรายการเก่าที่ไม่มีเจ้าของ)
export function canSeeAllExpenses(role: Role): boolean {
  return role === "admin" || role === "super_admin";
}

// จัดการบัญชีผู้ใช้ อนุมัติ เปลี่ยนระดับสิทธิ์ และดูประวัติการเข้าระบบ
export function canManageUsers(role: Role): boolean {
  return role === "super_admin";
}

// รีเซ็ตรหัสผ่านของบัญชีอื่นได้ไหม
// super admin เท่านั้น และรีเซ็ตได้เฉพาะบัญชี admin กับ user
// เพื่อไม่ให้ super admin ยึดบัญชีของ super admin คนอื่น
export function canResetPasswordOf(actorRole: Role, targetRole: Role): boolean {
  return actorRole === "super_admin" && targetRole !== "super_admin";
}
