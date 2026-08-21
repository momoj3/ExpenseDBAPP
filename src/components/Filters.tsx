"use client";

import { CATEGORIES } from "@/lib/categories";

type Props = {
  month: string;
  category: string;
  onMonthChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
};

export default function Filters({ month, category, onMonthChange, onCategoryChange }: Props) {
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-line">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-strong">เดือน</span>
        <input
          type="month"
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          className="rounded-lg border border-line-strong px-3 py-2 outline-none focus:border-brand"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-strong">หมวด</span>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded-lg border border-line-strong px-3 py-2 outline-none focus:border-brand"
        >
          <option value="">ทุกหมวด</option>
          {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
      </label>

      {(month || category) && (
        <button
          onClick={() => { onMonthChange(""); onCategoryChange(""); }}
          className="rounded-lg px-4 py-2 text-sm font-medium text-ink ring-1 ring-line-strong hover:bg-ice"
        >
          ล้างตัวกรอง
        </button>
      )}
    </div>
  );
}
