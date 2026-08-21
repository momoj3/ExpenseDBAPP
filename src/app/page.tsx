"use client";

import { useEffect, useMemo, useState } from "react";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseTable from "@/components/ExpenseTable";
import CategorySummary from "@/components/CategorySummary";
import Filters from "@/components/Filters";
import { formatBaht } from "@/lib/categories";
import {
  isSupabaseConfigured,
  missingEnvVars,
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/lib/supabase";
import type { Expense } from "@/lib/types";

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Expense | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [category, setCategory] = useState("");

  // โหลดรายการทั้งหมดจาก Supabase ครั้งเดียวเมื่อเปิดหน้า
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let cancelled = false;
    listExpenses()
      .then((rows) => {
        if (!cancelled) setExpenses(rows);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // เรียงวันที่จากใหม่ไปเก่า ใช้จัดลำดับใหม่หลังเพิ่มหรือแก้ไขรายการ
  function sortByDateDesc(rows: Expense[]): Expense[] {
    return [...rows].sort((a, b) => {
      if (a.expense_date !== b.expense_date) return a.expense_date < b.expense_date ? 1 : -1;
      return b.id - a.id;
    });
  }

  async function save(data: Omit<Expense, "id">, id?: number) {
    setError("");
    try {
      if (id) {
        const updated = await updateExpense(id, data);
        setExpenses((prev) => sortByDateDesc(prev.map((e) => (e.id === id ? updated : e))));
        setEditing(null);
      } else {
        const created = await createExpense(data);
        setExpenses((prev) => sortByDateDesc([created, ...prev]));
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function remove(id: number) {
    setError("");
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      if (editing?.id === id) setEditing(null);
    } catch (e) {
      setError((e as Error).message);
    }
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

  const header = (
    <header className="mb-8">
      <h1 className="text-3xl font-bold text-navy">MyExpense</h1>
      <p className="mt-1 text-ink">บันทึกรายจ่ายส่วนตัว</p>
    </header>
  );

  // ยังไม่ได้ตั้งค่าการเชื่อมต่อ — บอกวิธีตั้งค่า ไม่ปล่อยให้หน้าเว็บพัง
  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        {header}
        <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-line">
          <h2 className="text-lg font-semibold text-navy">ยังเชื่อมต่อฐานข้อมูลไม่ได้</h2>
          <p className="mt-3 text-ink-strong">
            แอปยังไม่พบค่าที่ใช้เชื่อมต่อ Supabase จึงยังบันทึกและอ่านรายจ่ายไม่ได้
          </p>
          <p className="mt-4 text-ink-strong">
            กรุณาสร้างไฟล์ <code className="rounded bg-mist px-1.5 py-0.5 text-sm">.env.local</code>{" "}
            ที่โฟลเดอร์บนสุดของโปรเจกต์ แล้วใส่ค่าต่อไปนี้ให้ครบ
          </p>
          <ul className="mt-3 space-y-1.5">
            {missingEnvVars.map((name) => (
              <li key={name} className="text-ink-strong">
                <code className="rounded bg-mist px-1.5 py-0.5 text-sm">{name}</code>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-ink">
            ดูชื่อตัวแปรทั้งหมดได้จากไฟล์{" "}
            <code className="rounded bg-mist px-1.5 py-0.5 text-sm">.env.local.example</code>{" "}
            และคัดลอกค่าได้จากหน้า Project Settings → API ของ Supabase
          </p>
          <p className="mt-4 text-steel">
            ตั้งค่าแล้วต้องปิดและเปิดเซิร์ฟเวอร์ใหม่ (<code className="text-sm">npm run dev</code>){" "}
            เพราะ Next.js อ่านค่าเหล่านี้ตอนเริ่มทำงาน
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {header}

      <div className="mb-6 rounded-xl bg-brand p-6 text-white shadow-sm">
        <p className="text-sm text-tint">ยอดรวมตามเงื่อนไขที่เลือก</p>
        <p className="mt-1 text-4xl font-bold">{formatBaht(total)}</p>
        <p className="mt-1 text-sm text-tint">{filtered.length} รายการ จากทั้งหมด {expenses.length} รายการ</p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-mist p-4 text-ink-strong ring-1 ring-line-strong">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <ExpenseForm onSave={save} editing={editing} onCancelEdit={() => setEditing(null)} />
        <Filters month={month} category={category} onMonthChange={setMonth} onCategoryChange={setCategory} />
        {loading ? (
          <div className="rounded-xl bg-white p-10 text-center text-steel shadow-sm ring-1 ring-line">
            กำลังโหลดข้อมูล...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ExpenseTable expenses={filtered} onEdit={setEditing} onDelete={remove} />
            </div>
            <CategorySummary expenses={filtered} />
          </div>
        )}
      </div>
    </main>
  );
}
