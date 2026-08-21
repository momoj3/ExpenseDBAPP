export type Expense = {
  id: number; // ตรงกับคอลัมน์ id ในตาราง expenses ซึ่งเป็นเลขที่ฐานข้อมูลสร้างให้
  expense_date: string; // YYYY-MM-DD
  category: string;
  amount: number;
  note: string;
  user_id: number | null; // เจ้าของรายการ · null คือรายการเก่าที่บันทึกก่อนมีระบบผู้ใช้
  owner_name?: string; // ชื่อเจ้าของ ใส่มาให้เฉพาะตอน admin ดูรายการของทุกคน
};

// ระดับสิทธิ์ ตรงกับ check constraint ของคอลัมน์ users.role
export type Role = "super_admin" | "admin" | "user";

export type User = {
  id: number;
  username: string;
  full_name: string;
  department: string;
  role: Role;
  is_approved: boolean;
  created_at: string;
};

export type LoginLog = {
  id: number;
  user_id: number | null;
  username: string;
  action: "login" | "logout" | "failed" | "password_reset";
  detail: string;
  ip: string;
  user_agent: string;
  created_at: string;
};

// ข้อมูลผู้ใช้ที่เก็บใน session cookie — เก็บเท่าที่หน้าจอต้องใช้ ไม่เก็บรหัสผ่าน
export type SessionUser = {
  userId: number;
  username: string;
  fullName: string;
  role: Role;
};
