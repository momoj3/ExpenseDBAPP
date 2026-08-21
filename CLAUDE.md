@AGENTS.md

# MyExpense

แอปบันทึกรายจ่ายส่วนตัว ภาษาไทยทั้งแอป ผู้ใช้คนเดียว **ไม่มีระบบ login** และไม่ต้องทำ auth/multi-user
เป็นโปรเจกต์ประกอบคอร์ส 9Expert — โค้ดต้องอ่านง่ายและตรงไปตรงมา เลี่ยง abstraction ที่ไม่จำเป็น

## Stack

Next.js 16.2.12 (App Router, Turbopack) · React 19.2.4 · TypeScript strict · Tailwind CSS v4 (ผ่าน `@tailwindcss/postcss`)

Tailwind v4 ไม่มี `tailwind.config.js` — ธีมทั้งหมดอยู่ในบล็อก `@theme` ของ [src/app/globals.css](src/app/globals.css)

## โครงสร้าง

```
src/app/layout.tsx        ฟอนต์ Noto Sans Thai + metadata (lang="th")
src/app/page.tsx          หน้าเดียวของแอป ถือ state ทั้งหมด
src/app/globals.css       design tokens ของ 9Expert CI
src/components/           ExpenseForm / ExpenseTable / Filters / CategorySummary
src/lib/categories.ts     CATEGORIES, CATEGORY_COLOR, formatBaht, today
src/lib/types.ts          type Expense
src/lib/validate.ts       กฎตรวจข้อมูลก่อนบันทึก + ข้อความเตือนภาษาไทย
supabase/                 SQL script สำหรับรันใน Supabase SQL Editor
```

## กติกาที่ต้องรักษา

**สี** — ใช้เฉพาะ token ที่ประกาศใน `@theme` (`bg-brand`, `text-navy`, `ring-line`, `bg-mist` ฯลฯ)
ห้ามใส่ hex ตรง ๆ ใน className และ **ห้ามใช้โทนอุ่นทุกกรณี** (ส้ม แดง เหลือง อำพัน) — รวมถึงสีแจ้ง error
ด้วย ซึ่งในแอปนี้ใช้ `border-navy` + `bg-mist` แทนกรอบแดง

**หมวดค่าใช้จ่าย** — `CATEGORIES` ใน `src/lib/categories.ts` เป็นแหล่งเดียว มี 6 หมวด:
อาหาร เดินทาง ช้อปปิ้ง ค่าบ้าน สุขภาพ อื่น ๆ — ห้าม hardcode ชื่อหมวดที่อื่น และถ้าเพิ่มหมวดต้องเพิ่ม
สีใน `CATEGORY_COLOR` ด้วย

**ข้อความ UI** — ภาษาไทยทั้งหมด จำนวนเงินแสดงผ่าน `formatBaht()` เท่านั้น (คอมมาคั่นหลักพัน ทศนิยม 2 ตำแหน่ง ลงท้าย "บาท")

**คอมเมนต์ในโค้ด** — เขียนภาษาไทย ตามสไตล์ไฟล์ที่มีอยู่

## ฐานข้อมูล — ยังไม่ได้ต่อ

ตอนนี้ข้อมูลอยู่ใน `useState` ของ `page.tsx` เท่านั้น **refresh แล้วหาย** ยังไม่มี `@supabase/supabase-js`
ในโปรเจกต์ และยังไม่มีโค้ดไหนอ่าน env

`.env.local` มีค่าพร้อมแล้ว (ไม่ถูก commit ตามกติกา `.env*` ใน `.gitignore`) ชื่อตัวแปรที่ต้องใช้:
`NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
ค่าเดียวกันนี้ต้องไปตั้งเป็น Environment Variables บน Vercel ด้วย ไม่งั้น production จะพัง

ตาราง Supabase เตรียมไว้แล้วที่ [supabase/myexpense-seed.sql](supabase/myexpense-seed.sql) — ตาราง
`public.expenses` เดียวเท่านั้น ห้ามสร้างตารางอื่น คอลัมน์: `id` (identity, PK), `expense_date` (date,
not null), `category` (text, not null), `amount` (numeric(12,2), > 0), `note` (text, null ได้),
`created_at` (timestamptz, default now())

จุดที่ต้องระวังเมื่อจะต่อ Supabase:
- `Expense.id` ในฝั่ง TS เป็น `string` (จาก `crypto.randomUUID()`) แต่ `expenses.id` ใน DB เป็น `bigint` — ต้องเลือกให้ตรงกันก่อน
- `note` ในฝั่ง TS เป็น `string` (ไม่มี `null`) แต่ DB ยอมให้ `null`
- script ขึ้นต้นด้วย `DROP TABLE` — ห้ามรันซ้ำหลังเริ่มบันทึกข้อมูลจริง
- ยังไม่ได้เปิด RLS ตามที่เจ้าของโปรเจกต์สั่งไว้ ถ้าจะขึ้นใช้จริงต้องคุยเรื่องนี้ก่อน

## คำสั่ง

```bash
npm install     # node_modules ไม่ได้อยู่ในโฟลเดอร์นี้ ต้องรันก่อนทุกครั้งที่ clone/คัดลอกมาใหม่
npm run dev
npm run build
npm run lint
```

## Deploy

Vercel team `rattanapon` · project `myexpense` · production https://myexpense-rattanapon.vercel.app

โฟลเดอร์นี้**ไม่ใช่ git repo** จึง deploy ด้วยการส่งไฟล์ตรงขึ้น Vercel (`deploy_to_vercel`) ไม่ใช่ผ่าน
git integration — ต้องส่ง source ทั้งชุดทุกครั้ง

โปรเจกต์เปิด Vercel Authentication อยู่ URL จึงยัง redirect ไปหน้า login ของ Vercel ไม่ใช่เปิดสาธารณะ

## ที่ทราบว่ายังไม่ถูก

`today()` และ default month ใช้ `new Date().toISOString()` ซึ่งเป็นเวลา UTC ไม่ใช่เวลาไทย (UTC+7)
ช่วงเที่ยงคืนถึง 07:00 ตามเวลาไทยจะได้วันที่ของ "เมื่อวาน" ทำให้ค่าเริ่มต้นในฟอร์มผิด และกฎ
"ห้ามเป็นวันในอนาคต" ใน `validate.ts` อาจปฏิเสธรายการของวันนี้
