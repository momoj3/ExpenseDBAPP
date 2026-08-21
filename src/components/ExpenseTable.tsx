"use client";

import { CATEGORY_COLOR, formatBaht } from "@/lib/categories";
import type { Expense } from "@/lib/types";

type Props = {
  expenses: Expense[];
  onEdit: (e: Expense) => void;
  onDelete: (id: number) => void;
  showOwner?: boolean; // admin และ super admin เห็นของทุกคน จึงต้องรู้ว่าแถวไหนของใคร
};

export default function ExpenseTable({ expenses, onEdit, onDelete, showOwner = false }: Props) {
  if (expenses.length === 0) {
    return (
      <div className="rounded-xl bg-white p-10 text-center text-steel shadow-sm ring-1 ring-line">
        ไม่มีรายการที่ตรงกับเงื่อนไขที่เลือก
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-line">
      <table className="w-full text-sm">
        <thead className="bg-mist text-left text-ink">
          <tr>
            <th className="px-4 py-3 font-medium">วันที่</th>
            <th className="px-4 py-3 font-medium">หมวด</th>
            {showOwner && <th className="px-4 py-3 font-medium">เจ้าของ</th>}
            <th className="px-4 py-3 font-medium">บันทึกช่วยจำ</th>
            <th className="px-4 py-3 text-right font-medium">จำนวนเงิน</th>
            <th className="px-4 py-3 text-right font-medium">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {expenses.map((e) => (
            <tr key={e.id} className="hover:bg-ice">
              <td className="whitespace-nowrap px-4 py-3 text-ink-strong">{e.expense_date}</td>
              <td className="px-4 py-3">
                <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${CATEGORY_COLOR[e.category] ?? "bg-mist text-ink-strong"}`}>
                  {e.category}
                </span>
              </td>
              {showOwner && (
                <td className="whitespace-nowrap px-4 py-3 text-ink">{e.owner_name || "-"}</td>
              )}
              <td className="px-4 py-3 text-ink">{e.note || "-"}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-navy">{formatBaht(e.amount)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <button onClick={() => onEdit(e)} className="text-sm font-medium text-brand hover:underline">แก้ไข</button>
                <button onClick={() => onDelete(e.id)} className="ml-3 text-sm font-medium text-navy hover:underline">ลบ</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
