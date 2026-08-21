"use client";

import { CATEGORY_COLOR, formatBaht } from "@/lib/categories";
import type { Expense } from "@/lib/types";

export default function CategorySummary({ expenses }: { expenses: Expense[] }) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const byCategory = Object.entries(
    expenses.reduce<Record<string, { sum: number; count: number }>>((acc, e) => {
      acc[e.category] = acc[e.category] ?? { sum: 0, count: 0 };
      acc[e.category].sum += e.amount;
      acc[e.category].count += 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1].sum - a[1].sum);

  if (byCategory.length === 0) return null;

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-line">
      <h2 className="mb-4 text-lg font-semibold text-navy">สรุปยอดตามหมวด</h2>
      <div className="space-y-3">
        {byCategory.map(([cat, v]) => {
          const pct = total > 0 ? Math.round((v.sum / total) * 100) : 0;
          return (
            <div key={cat}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${CATEGORY_COLOR[cat] ?? "bg-mist text-ink-strong"}`}>
                  {cat}
                </span>
                <span className="text-ink-strong">
                  <span className="font-medium">{formatBaht(v.sum)}</span>
                  <span className="ml-2 text-steel-light">{v.count} รายการ · {pct}%</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-mist">
                <div className="h-full rounded-full bg-azure" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
