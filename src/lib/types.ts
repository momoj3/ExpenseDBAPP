export type Expense = {
  id: number; // ตรงกับคอลัมน์ id ในตาราง expenses ซึ่งเป็นเลขที่ฐานข้อมูลสร้างให้
  expense_date: string; // YYYY-MM-DD
  category: string;
  amount: number;
  note: string;
};
