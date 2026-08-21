import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { canSeeAllExpenses } from "./roles";
import { isSessionConfigured } from "./session-token";
import type { Expense, LoginLog, Role, SessionUser, User } from "./types";

// จุดเชื่อมต่อฐานข้อมูลจุดเดียวของทั้งแอป และเป็นไฟล์ฝั่ง server เท่านั้น
// (`import "server-only"` จะทำให้ build ล้มถ้ามี client component เผลอ import เข้ามา)
//
// ใช้ secret key ซึ่งข้าม RLS ได้ จึงห้ามให้ค่านี้หลุดไปถึงเบราว์เซอร์เด็ดขาด
// สังเกตว่าชื่อตัวแปรไม่มี NEXT_PUBLIC_ นำหน้า Next.js จึงไม่ฝังลงใน bundle

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

export const isSupabaseConfigured = Boolean(url && secretKey) && isSessionConfigured;

// รายชื่อตัวแปรที่ยังขาด ใช้แสดงในหน้าบอกวิธีตั้งค่า
export const missingEnvVars = [
  !url && "NEXT_PUBLIC_SUPABASE_URL",
  !secretKey && "SUPABASE_SECRET_KEY",
  !isSessionConfigured && "SESSION_SECRET (ต้องยาวอย่างน้อย 32 ตัวอักษร)",
].filter(Boolean) as string[];

const client: SupabaseClient | null =
  url && secretKey
    ? createClient(url, secretKey, { auth: { persistSession: false } })
    : null;

function db(): SupabaseClient {
  if (!client) throw new Error("ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase");
  return client;
}

// ============================================================
// รายจ่าย
// ============================================================

const EXPENSES = "expenses";
const EXPENSE_COLUMNS = "id, expense_date, category, amount, note, user_id";

type ExpenseRow = {
  id: number;
  expense_date: string;
  category: string;
  amount: number | string;
  note: string | null;
  user_id: number | null;
};

// amount แปลงเป็น number เสมอ เพราะคอลัมน์เป็น numeric ซึ่งส่งมาเป็นข้อความ
// note แปลง null เป็นข้อความว่าง เพื่อให้ input ในฟอร์มใช้ได้เลย
function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    expense_date: row.expense_date,
    category: row.category,
    amount: Number(row.amount),
    note: row.note ?? "",
    user_id: row.user_id,
  };
}

function toExpenseRow(data: Omit<Expense, "id" | "user_id" | "owner_name">) {
  return {
    expense_date: data.expense_date,
    category: data.category,
    amount: data.amount,
    note: data.note.trim() === "" ? null : data.note.trim(),
  };
}

export type ExpenseInput = Omit<Expense, "id" | "user_id" | "owner_name">;

// อ่านรายการที่ผู้ใช้คนนี้มีสิทธิ์เห็น เรียงวันที่จากใหม่ไปเก่า
// user ทั่วไปเห็นเฉพาะของตัวเอง · admin และ super admin เห็นของทุกคน
// รวมรายการเก่าที่ user_id เป็น null ด้วย
export async function listExpensesFor(actor: SessionUser): Promise<Expense[]> {
  let query = db()
    .from(EXPENSES)
    .select(EXPENSE_COLUMNS)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (!canSeeAllExpenses(actor.role)) {
    query = query.eq("user_id", actor.userId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`โหลดรายการไม่สำเร็จ: ${error.message}`);

  const expenses = (data as ExpenseRow[]).map(toExpense);
  if (!canSeeAllExpenses(actor.role)) return expenses;

  // admin เห็นของทุกคน จึงต้องรู้ว่าแต่ละรายการเป็นของใคร
  const owners = await mapUserIdToName();
  return expenses.map((e) => ({
    ...e,
    owner_name: e.user_id === null ? "" : owners.get(e.user_id) ?? "",
  }));
}

// เพิ่มรายการใหม่ เจ้าของคือผู้ใช้ที่เข้าสู่ระบบอยู่เท่านั้น
// ไม่รับ user_id จากฝั่ง client เพื่อไม่ให้สวมรอยบันทึกในชื่อคนอื่น
export async function createExpenseFor(actor: SessionUser, data: ExpenseInput): Promise<Expense> {
  const { data: row, error } = await db()
    .from(EXPENSES)
    .insert({ ...toExpenseRow(data), user_id: actor.userId })
    .select(EXPENSE_COLUMNS)
    .single();

  if (error) throw new Error(`บันทึกรายการไม่สำเร็จ: ${error.message}`);
  return toExpense(row as ExpenseRow);
}

// แก้ไขรายการ · user ทั่วไปแก้ได้เฉพาะของตัวเอง
export async function updateExpenseFor(
  actor: SessionUser,
  id: number,
  data: ExpenseInput
): Promise<Expense> {
  let query = db().from(EXPENSES).update(toExpenseRow(data)).eq("id", id);
  if (!canSeeAllExpenses(actor.role)) {
    query = query.eq("user_id", actor.userId);
  }

  const { data: row, error } = await query.select(EXPENSE_COLUMNS).maybeSingle();
  if (error) throw new Error(`แก้ไขรายการไม่สำเร็จ: ${error.message}`);
  if (!row) throw new Error("แก้ไขรายการไม่สำเร็จ: ไม่พบรายการนี้ หรือไม่มีสิทธิ์แก้ไข");

  return toExpense(row as ExpenseRow);
}

// ลบรายการ · user ทั่วไปลบได้เฉพาะของตัวเอง
export async function deleteExpenseFor(actor: SessionUser, id: number): Promise<void> {
  let query = db().from(EXPENSES).delete().eq("id", id);
  if (!canSeeAllExpenses(actor.role)) {
    query = query.eq("user_id", actor.userId);
  }

  const { data, error } = await query.select("id");
  if (error) throw new Error(`ลบรายการไม่สำเร็จ: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error("ลบรายการไม่สำเร็จ: ไม่พบรายการนี้ หรือไม่มีสิทธิ์ลบ");
  }
}

// ============================================================
// ผู้ใช้
// ============================================================

const USERS = "users";
const USER_COLUMNS = "id, username, full_name, department, role, is_approved, created_at";

type UserRow = {
  id: number;
  username: string;
  full_name: string;
  department: string | null;
  role: Role;
  is_approved: boolean;
  created_at: string;
};

function toUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    full_name: row.full_name,
    department: row.department ?? "",
    role: row.role,
    is_approved: row.is_approved,
    created_at: row.created_at,
  };
}

async function mapUserIdToName(): Promise<Map<number, string>> {
  const { data, error } = await db().from(USERS).select("id, full_name");
  if (error) throw new Error(`โหลดรายชื่อผู้ใช้ไม่สำเร็จ: ${error.message}`);

  const map = new Map<number, string>();
  for (const row of data as { id: number; full_name: string }[]) {
    map.set(row.id, row.full_name);
  }
  return map;
}

// อ่านบัญชีพร้อม hash ของรหัสผ่าน ใช้เฉพาะตอนตรวจการเข้าสู่ระบบ
export async function findUserForLogin(
  username: string
): Promise<(User & { password_hash: string }) | null> {
  const { data, error } = await db()
    .from(USERS)
    .select(`${USER_COLUMNS}, password_hash`)
    .eq("username", username)
    .maybeSingle();

  if (error) throw new Error(`ตรวจสอบบัญชีไม่สำเร็จ: ${error.message}`);
  if (!data) return null;

  const row = data as UserRow & { password_hash: string };
  return { ...toUser(row), password_hash: row.password_hash };
}

export async function getUserById(id: number): Promise<User | null> {
  const { data, error } = await db().from(USERS).select(USER_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`อ่านข้อมูลบัญชีไม่สำเร็จ: ${error.message}`);
  return data ? toUser(data as UserRow) : null;
}

export async function listUsers(): Promise<User[]> {
  const { data, error } = await db()
    .from(USERS)
    .select(USER_COLUMNS)
    .order("is_approved", { ascending: true }) // ที่รออนุมัติขึ้นก่อน
    .order("created_at", { ascending: false });

  if (error) throw new Error(`โหลดรายชื่อผู้ใช้ไม่สำเร็จ: ${error.message}`);
  return (data as UserRow[]).map(toUser);
}

// สมัครบัญชีใหม่ — สร้างแบบยังไม่อนุมัติและเป็นระดับ user เสมอ
export async function insertPendingUser(input: {
  username: string;
  passwordHash: string;
  fullName: string;
  department: string;
}): Promise<User> {
  const { data, error } = await db()
    .from(USERS)
    .insert({
      username: input.username,
      password_hash: input.passwordHash,
      full_name: input.fullName,
      department: input.department.trim() === "" ? null : input.department.trim(),
      role: "user",
      is_approved: false,
    })
    .select(USER_COLUMNS)
    .single();

  // 23505 คือ unique violation ของ Postgres แปลว่า username ซ้ำ
  if (error) {
    if (error.code === "23505") throw new Error("ชื่อผู้ใช้นี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น");
    throw new Error(`สมัครสมาชิกไม่สำเร็จ: ${error.message}`);
  }
  return toUser(data as UserRow);
}

export async function setUserApproved(id: number, approved: boolean): Promise<void> {
  const { error } = await db().from(USERS).update({ is_approved: approved }).eq("id", id);
  if (error) throw new Error(`อัปเดตสถานะอนุมัติไม่สำเร็จ: ${error.message}`);
}

export async function setUserRole(id: number, role: Role): Promise<void> {
  const { error } = await db().from(USERS).update({ role }).eq("id", id);
  if (error) throw new Error(`เปลี่ยนระดับสิทธิ์ไม่สำเร็จ: ${error.message}`);
}

export async function setUserPasswordHash(id: number, passwordHash: string): Promise<void> {
  const { error } = await db().from(USERS).update({ password_hash: passwordHash }).eq("id", id);
  if (error) throw new Error(`รีเซ็ตรหัสผ่านไม่สำเร็จ: ${error.message}`);
}

// ============================================================
// ประวัติการเข้าสู่ระบบ
// ============================================================

const LOGIN_LOGS = "login_logs";

export async function writeLoginLog(entry: {
  userId: number | null;
  username: string;
  action: LoginLog["action"];
  detail?: string;
  ip?: string;
  userAgent?: string;
}): Promise<void> {
  const { error } = await db().from(LOGIN_LOGS).insert({
    user_id: entry.userId,
    username: entry.username,
    action: entry.action,
    detail: entry.detail ?? null,
    ip: entry.ip ?? null,
    user_agent: entry.userAgent ?? null,
  });

  // การเขียน log ล้มเหลวไม่ควรทำให้เข้าสู่ระบบไม่ได้ จึงแค่เตือนใน console
  if (error) console.error("เขียนประวัติการเข้าระบบไม่สำเร็จ:", error.message);
}

export async function listLoginLogs(limit = 200): Promise<LoginLog[]> {
  const { data, error } = await db()
    .from(LOGIN_LOGS)
    .select("id, user_id, username, action, detail, ip, user_agent, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`โหลดประวัติการเข้าระบบไม่สำเร็จ: ${error.message}`);

  return (data as (Omit<LoginLog, "detail" | "ip" | "user_agent"> & {
    detail: string | null;
    ip: string | null;
    user_agent: string | null;
  })[]).map((row) => ({
    ...row,
    detail: row.detail ?? "",
    ip: row.ip ?? "",
    user_agent: row.user_agent ?? "",
  }));
}
