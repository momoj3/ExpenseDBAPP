import { today } from "./categories";

export type ExpenseInput = {
  expense_date: string;
  category: string;
  amount: string;
  note: string;
};

export type Errors = Partial<Record<keyof ExpenseInput, string>>;

// ตรวจข้อมูลก่อนบันทึก คืนค่าเป็นข้อความเตือนภาษาไทยของแต่ละช่อง
export function validate(input: ExpenseInput): Errors {
  const errors: Errors = {};

  if (!input.expense_date) {
    errors.expense_date = "กรุณาเลือกวันที่";
  } else if (input.expense_date > today()) {
    errors.expense_date = "วันที่ใช้จ่ายต้องไม่เป็นวันในอนาคต";
  }

  if (!input.category) {
    errors.category = "กรุณาเลือกหมวด";
  }

  const amount = Number(input.amount);
  if (input.amount === "" || Number.isNaN(amount)) {
    errors.amount = "กรุณากรอกจำนวนเงิน";
  } else if (amount <= 0) {
    errors.amount = "จำนวนเงินต้องมากกว่า 0 บาท";
  } else if (amount > 500000) {
    errors.amount = "จำนวนเงินต้องไม่เกิน 500,000 บาท";
  }

  return errors;
}

export function hasError(errors: Errors): boolean {
  return Object.keys(errors).length > 0;
}
