"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseTable from "@/components/ExpenseTable";
import CategorySummary from "@/components/CategorySummary";
import Filters from "@/components/Filters";
import { formatBaht } from "@/lib/categories";
import { addExpense, editExpense, fetchExpenses, removeExpense } from "@/lib/expenses-actions";
import { canSeeAllExpenses } from "@/lib/roles";
import type { Expense, SessionUser } from "@/lib/types";

// ส่วนที่ผู้ใช้ใช้บันทึกรายจ่าย ย้ายออกมาจาก page.tsx
// เพราะ page.tsx ต้องเป็น server component เพื่ออ่าน session cookie
//
// ทุกการอ่านเขียนวิ่งผ่าน server action ไม่มีการคุยกับ Supabase จากเบราว์เซอร์แล้ว
export default function ExpenseApp({ user }: { user: SessionUser }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Expense | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [category, setCategory] = useState("");

  // ตัวนับ id ชั่วคราวของรายการที่ยังส่งไม่เสร็จ นับถอยหลังจาก -1
  const tempIdRef = useRef(-1);

  const showOwner = canSeeAllExpenses(user.role);

  // โหลดรายการที่ผู้ใช้คนนี้มีสิทธิ์เห็น ครั้งเดียวเมื่อเปิดหน้า
  useEffect(() => {
    let cancelled = false;

    fetchExpenses()
      .then((result) => {
        if (cancelled) return;
        if (result.ok) setExpenses(result.expenses);
        else setError(result.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // เรียงวันที่จากใหม่ไปเก่า
  // วันเดียวกันเรียงรายการที่เพิ่งบันทึกขึ้นก่อน โดยรายการที่ยังส่งไม่เสร็จ
  // (id ชั่วคราวเป็นเลขลบ) ถือว่าใหม่สุด จะได้ไม่กระโดดตำแหน่งตอนบันทึกเสร็จ
  function sortByDateDesc(rows: Expense[]): Expense[] {
    return [...rows].sort((a, b) => {
      if (a.expense_date !== b.expense_date) return a.expense_date < b.expense_date ? 1 : -1;

      const aPending = a.id < 0;
      const bPending = b.id < 0;
      if (aPending !== bPending) return aPending ? -1 : 1;
      if (aPending && bPending) return a.id - b.id; // ยิ่งลบมาก ยิ่งเพิ่งกด

      return b.id - a.id;
    });
  }

  async function save(data: Omit<Expense, "id" | "user_id" | "owner_name">, id?: number) {
    setError("");

    if (id) {
      const result = await editExpense(id, data);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      const updated = result.expense;
      setExpenses((prev) => sortByDateDesc(prev.map((e) => (e.id === id ? updated : e))));
      setEditing(null);
      return;
    }

    // บันทึกรายการใหม่ — แสดงบนหน้าจอทันทีก่อน แล้วส่งไปฐานข้อมูลเบื้องหลัง
    const tempId = tempIdRef.current--;
    setExpenses((prev) =>
      sortByDateDesc([
        { ...data, id: tempId, user_id: user.userId, owner_name: user.fullName },
        ...prev,
      ])
    );

    // ไม่ await เพื่อให้ฟอร์มพร้อมรับรายการถัดไปได้เลย ไม่ต้องรอฐานข้อมูลตอบ
    addExpense(data).then((result) => {
      if (result.ok) {
        // สำเร็จ — สลับรายการชั่วคราวเป็นรายการจริงที่มี id จากฐานข้อมูล
        const created = { ...result.expense, owner_name: user.fullName };
        setExpenses((prev) => sortByDateDesc(prev.map((e) => (e.id === tempId ? created : e))));
      } else {
        // ไม่สำเร็จ — เอารายการชั่วคราวออกจากหน้าจอ แล้วบอกเหตุผล
        setExpenses((prev) => prev.filter((e) => e.id !== tempId));
        setEditing((cur) => (cur?.id === tempId ? null : cur));
        setError(result.message);
      }
    });
  }

  async function remove(id: number) {
    setError("");
    const result = await removeExpense(id);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (editing?.id === id) setEditing(null);
  }

  const filtered = useMemo(
    () =>
      expenses.filter(
        (e) =>
          (!month || e.expense_date.startsWith(month)) &&
          (!category || e.category === category)
      ),
    [expenses, month, category]
  );

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <>
      <div className="mb-6 rounded-xl bg-brand p-6 text-white shadow-sm">
        <p className="text-sm text-tint">ยอดรวมตามเงื่อนไขที่เลือก</p>
        <p className="mt-1 text-4xl font-bold">{formatBaht(total)}</p>
        <p className="mt-1 text-sm text-tint">
          {filtered.length} รายการ จากทั้งหมด {expenses.length} รายการ
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-mist p-4 text-ink-strong ring-1 ring-line-strong">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <ExpenseForm onSave={save} editing={editing} onCancelEdit={() => setEditing(null)} />
        <Filters
          month={month}
          category={category}
          onMonthChange={setMonth}
          onCategoryChange={setCategory}
        />
        {loading ? (
          <div className="rounded-xl bg-white p-10 text-center text-steel shadow-sm ring-1 ring-line">
            กำลังโหลดข้อมูล...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ExpenseTable
                expenses={filtered}
                onEdit={setEditing}
                onDelete={remove}
                showOwner={showOwner}
              />
            </div>
            <CategorySummary expenses={filtered} />
          </div>
        )}
      </div>
    </>
  );
}
