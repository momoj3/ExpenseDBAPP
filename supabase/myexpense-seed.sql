-- ============================================================
-- MyExpense : สร้างตาราง expenses + ข้อมูลตัวอย่าง
-- คัดลอกทั้งไฟล์นี้ไปวางใน SQL Editor ของ Supabase แล้วกด Run
-- รันซ้ำได้เรื่อย ๆ โดยไม่ error (ลบตารางเดิมทิ้งก่อนทุกครั้ง)
-- ============================================================

-- ลบตารางเดิมทิ้งก่อน เพื่อให้ script นี้รันซ้ำได้
DROP TABLE IF EXISTS public.expenses;

-- ตารางเก็บรายจ่าย 1 แถว = 1 รายการ
CREATE TABLE public.expenses (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  expense_date DATE          NOT NULL,
  category     TEXT          NOT NULL,
  amount       NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  note         TEXT,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- คำอธิบายตารางและคอลัมน์ (ภาษาไทย)
COMMENT ON TABLE  public.expenses              IS 'ตารางรายจ่ายของแอป MyExpense เก็บ 1 แถวต่อ 1 รายการรายจ่าย';
COMMENT ON COLUMN public.expenses.id           IS 'รหัสประจำแถว สร้างค่าอัตโนมัติ ใช้เป็น primary key';
COMMENT ON COLUMN public.expenses.expense_date IS 'วันที่ที่เกิดรายจ่าย ชนิดวันที่ ห้ามว่าง';
COMMENT ON COLUMN public.expenses.category     IS 'หมวดของรายจ่าย เช่น อาหาร เดินทาง ช้อปปิ้ง ค่าบ้าน สุขภาพ อื่น ๆ ห้ามว่าง';
COMMENT ON COLUMN public.expenses.amount       IS 'จำนวนเงิน ทศนิยม 2 ตำแหน่ง ต้องมากกว่า 0 เสมอ';
COMMENT ON COLUMN public.expenses.note         IS 'บันทึกช่วยจำเพิ่มเติม ปล่อยว่างได้';
COMMENT ON COLUMN public.expenses.created_at   IS 'เวลาที่สร้างแถวนี้ บันทึกอัตโนมัติเมื่อเพิ่มข้อมูล';

-- ============================================================
-- ข้อมูลตัวอย่าง 8 แถว ของเดือนนี้ (สิงหาคม 2026)
-- ครอบคลุม 6 หมวด และมี 2 แถวที่ปล่อย note ว่าง
-- ============================================================
INSERT INTO public.expenses (expense_date, category, amount, note) VALUES
  ('2026-08-02', 'อาหาร',     120.00, 'ข้าวมันไก่ + น้ำ'),
  ('2026-08-04', 'เดินทาง',    45.50, 'ค่า BTS ไปทำงาน'),
  ('2026-08-06', 'ช้อปปิ้ง',  890.00, 'เสื้อยืด 2 ตัว'),
  ('2026-08-09', 'ค่าบ้าน',  7500.00, 'ค่าเช่าห้องเดือนสิงหาคม'),
  ('2026-08-12', 'สุขภาพ',    350.75, NULL),
  ('2026-08-15', 'อาหาร',     260.00, 'กาแฟ + เบเกอรี่กับเพื่อน'),
  ('2026-08-18', 'อื่น ๆ',    199.00, NULL),
  ('2026-08-20', 'เดินทาง',   180.00, 'แท็กซี่กลับบ้าน');

-- ตรวจผลลัพธ์อย่างรวดเร็ว
SELECT * FROM public.expenses ORDER BY expense_date;
