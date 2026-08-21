"use client";

import { useEffect, useState } from "react";
import { CATEGORIES, today } from "@/lib/categories";
import { validate, hasError, type Errors } from "@/lib/validate";
import type { Expense } from "@/lib/types";

type Props = {
  onSave: (data: Omit<Expense, "id">, id?: number) => void | Promise<void>;
  editing?: Expense | null;
  onCancelEdit?: () => void;
};

export default function ExpenseForm({ onSave, editing, onCancelEdit }: Props) {
  const [expenseDate, setExpenseDate] = useState(today());
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (editing) {
      setExpenseDate(editing.expense_date);
      setCategory(editing.category);
      setAmount(String(editing.amount));
      setNote(editing.note);
      setTouched(false);
      setErrors({});
    }
  }, [editing]);

  function reset() {
    setExpenseDate(today());
    setCategory(CATEGORIES[0]);
    setAmount("");
    setNote("");
    setErrors({});
    setTouched(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = { expense_date: expenseDate, category, amount, note };
    const found = validate(input);
    setErrors(found);
    setTouched(true);
    if (hasError(found)) return;

    await onSave({ expense_date: expenseDate, category, amount: Number(amount), note }, editing?.id);
    reset();
  }

  const err = (key: keyof Errors) =>
    touched && errors[key] ? <p className="mt-1 text-sm text-navy">{errors[key]}</p> : null;

  const inputCls = (key: keyof Errors) =>
    `w-full rounded-lg border px-3 py-2 outline-none focus:border-brand ${
      touched && errors[key] ? "border-navy bg-mist" : "border-line-strong"
    }`;

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-line">
      <h2 className="mb-4 text-lg font-semibold text-navy">
        {editing ? "แก้ไขรายจ่าย" : "บันทึกรายจ่ายใหม่"}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-strong">วันที่</span>
          <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className={inputCls("expense_date")} />
          {err("expense_date")}
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-strong">หมวด</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls("category")}>
            {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
          {err("category")}
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-strong">จำนวนเงิน (บาท)</span>
          <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={inputCls("amount")} />
          {err("amount")}
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-strong">บันทึกช่วยจำ</span>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น ข้าวกลางวัน" className={inputCls("note")} />
        </label>
      </div>

      <div className="mt-5 flex gap-3">
        <button type="submit" className="rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-deep">
          {editing ? "บันทึกการแก้ไข" : "บันทึกรายจ่าย"}
        </button>
        {editing && (
          <button type="button" onClick={() => { reset(); onCancelEdit?.(); }} className="rounded-lg px-5 py-2.5 font-medium text-ink ring-1 ring-line-strong hover:bg-ice">
            ยกเลิก
          </button>
        )}
      </div>
    </form>
  );
}
