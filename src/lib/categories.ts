// หมวดค่าใช้จ่ายของ MyExpense — ใช้ชุดนี้ทั้งแอป
export const CATEGORIES = [
  "อาหาร",
  "เดินทาง",
  "ช้อปปิ้ง",
  "ค่าบ้าน",
  "สุขภาพ",
  "อื่น ๆ",
] as const;

export type Category = (typeof CATEGORIES)[number];

// สีประจำหมวด ใช้กับป้ายกำกับในตาราง
export const CATEGORY_COLOR: Record<string, string> = {
  "อาหาร": "bg-tint text-brand-deep",
  "เดินทาง": "bg-azure-soft text-navy",
  "ช้อปปิ้ง": "bg-zest-soft text-zest-ink",
  "ค่าบ้าน": "bg-azure text-navy",
  "สุขภาพ": "bg-navy text-white",
  "อื่น ๆ": "bg-mist text-ink",
};

// แสดงจำนวนเงินให้มีคอมมาคั่นหลักพัน และลงท้ายด้วย บาท
export function formatBaht(n: number): string {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " บาท";
}

// วันนี้ในรูปแบบ YYYY-MM-DD สำหรับใส่ใน input type=date
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
