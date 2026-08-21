"use server";

import { requireSessionUser } from "./session";
import {
  createExpenseFor,
  deleteExpenseFor,
  listExpensesFor,
  updateExpenseFor,
  type ExpenseInput,
} from "./supabase";
import type { Expense } from "./types";

// ทางเข้าเดียวที่หน้าจอใช้คุยกับรายจ่ายในฐานข้อมูล
//
// ทุกฟังก์ชันอ่านผู้ใช้จาก session cookie เอง **ไม่รับ user_id จากฝั่ง client**
// เพราะค่าที่ client ส่งมาปลอมได้ การกรองว่าใครเห็นอะไรจึงต้องตัดสินที่ server เท่านั้น

export type ExpenseResult =
  | { ok: true; expense: Expense }
  | { ok: false; message: string };

export type ExpenseListResult =
  | { ok: true; expenses: Expense[] }
  | { ok: false; message: string };

export type DeleteResult = { ok: true } | { ok: false; message: string };

export async function fetchExpenses(): Promise<ExpenseListResult> {
  try {
    const actor = await requireSessionUser();
    return { ok: true, expenses: await listExpensesFor(actor) };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function addExpense(data: ExpenseInput): Promise<ExpenseResult> {
  try {
    const actor = await requireSessionUser();
    return { ok: true, expense: await createExpenseFor(actor, data) };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function editExpense(id: number, data: ExpenseInput): Promise<ExpenseResult> {
  try {
    const actor = await requireSessionUser();
    return { ok: true, expense: await updateExpenseFor(actor, id, data) };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function removeExpense(id: number): Promise<DeleteResult> {
  try {
    const actor = await requireSessionUser();
    await deleteExpenseFor(actor, id);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
