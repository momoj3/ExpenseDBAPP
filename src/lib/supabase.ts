import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Expense } from "./types";

// จุดเชื่อมต่อ Supabase จุดเดียวของทั้งแอป
// ส่วนอื่นของแอปเรียกใช้ผ่านฟังก์ชันในไฟล์นี้เท่านั้น ห้าม createClient ที่อื่น

// ต้องอ้าง process.env ด้วยชื่อตัวแปรตรง ๆ เพราะ Next.js แทนค่าตอน build
// ถ้าเขียนแบบ process.env[ชื่อตัวแปร] จะไม่ถูกแทนค่าและได้ undefined
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ตั้งค่าครบหรือยัง ใช้ตัดสินใจว่าจะแสดงหน้าแอปหรือหน้าบอกวิธีตั้งค่า
export const isSupabaseConfigured = Boolean(url && anonKey);

// รายชื่อตัวแปรที่ยังขาด ใช้แสดงในข้อความบอกผู้ใช้
export const missingEnvVars = [
  !url && "NEXT_PUBLIC_SUPABASE_URL",
  !anonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
].filter(Boolean) as string[];

const client: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null;

function db(): SupabaseClient {
  if (!client) throw new Error("ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase");
  return client;
}

const TABLE = "expenses";
const COLUMNS = "id, expense_date, category, amount, note";

// รูปแบบแถวที่ได้จากฐานข้อมูล — note เป็น null ได้ ต่างจาก Expense ที่ใช้ในแอป
type ExpenseRow = {
  id: number;
  expense_date: string;
  category: string;
  amount: number | string;
  note: string | null;
};

// แปลงแถวจากฐานข้อมูลเป็นรูปแบบที่หน้าจอใช้
// amount แปลงเป็น number เสมอ เพราะคอลัมน์เป็น numeric ซึ่งอาจส่งมาเป็นข้อความ
// note แปลง null เป็นข้อความว่าง เพื่อให้ input ในฟอร์มใช้ได้เลย
function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    expense_date: row.expense_date,
    category: row.category,
    amount: Number(row.amount),
    note: row.note ?? "",
  };
}

// แปลงข้อมูลจากฟอร์มเป็นค่าที่จะเขียนลงฐานข้อมูล
// บันทึกช่วยจำที่ปล่อยว่างเก็บเป็น null ไม่ใช่ข้อความว่าง
function toRow(data: Omit<Expense, "id">) {
  return {
    expense_date: data.expense_date,
    category: data.category,
    amount: data.amount,
    note: data.note.trim() === "" ? null : data.note.trim(),
  };
}

// อ่านรายการทั้งหมด เรียงวันที่จากใหม่ไปเก่า
// รายการวันเดียวกันเรียงตามลำดับที่บันทึกล่าสุดขึ้นก่อน
export async function listExpenses(): Promise<Expense[]> {
  const { data, error } = await db()
    .from(TABLE)
    .select(COLUMNS)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`โหลดรายการไม่สำเร็จ: ${error.message}`);
  return (data as ExpenseRow[]).map(toExpense);
}

// เพิ่มรายการใหม่ คืนแถวที่บันทึกแล้วพร้อม id จากฐานข้อมูล
export async function createExpense(data: Omit<Expense, "id">): Promise<Expense> {
  const { data: row, error } = await db()
    .from(TABLE)
    .insert(toRow(data))
    .select(COLUMNS)
    .single();

  if (error) throw new Error(`บันทึกรายการไม่สำเร็จ: ${error.message}`);
  return toExpense(row as ExpenseRow);
}

// แก้ไขรายการเดิมตาม id
export async function updateExpense(id: number, data: Omit<Expense, "id">): Promise<Expense> {
  const { data: row, error } = await db()
    .from(TABLE)
    .update(toRow(data))
    .eq("id", id)
    .select(COLUMNS)
    .single();

  if (error) throw new Error(`แก้ไขรายการไม่สำเร็จ: ${error.message}`);
  return toExpense(row as ExpenseRow);
}

// ลบรายการตาม id
export async function deleteExpense(id: number): Promise<void> {
  const { error } = await db().from(TABLE).delete().eq("id", id);
  if (error) throw new Error(`ลบรายการไม่สำเร็จ: ${error.message}`);
}
