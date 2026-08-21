@AGENTS.md

# MyExpense

แอปบันทึกรายจ่ายส่วนตัว ภาษาไทยทั้งแอป **มีระบบ login และสิทธิ์ 3 ระดับ**
เป็นโปรเจกต์ประกอบคอร์ส 9Expert — โค้ดต้องอ่านง่ายและตรงไปตรงมา เลี่ยง abstraction ที่ไม่จำเป็น

## Stack

Next.js 16.2.12 (App Router, Turbopack) · React 19.2.4 · TypeScript strict · Tailwind CSS v4 (ผ่าน
`@tailwindcss/postcss`) · Supabase (PostgreSQL) · bcryptjs

Tailwind v4 ไม่มี `tailwind.config.js` — ธีมทั้งหมดอยู่ในบล็อก `@theme` ของ [src/app/globals.css](src/app/globals.css)

## สถาปัตยกรรม — สำคัญที่สุดในไฟล์นี้

```
เบราว์เซอร์ ──► Server Action / proxy.ts ──► Supabase (SUPABASE_SECRET_KEY)
              (ตรวจ session cookie ทุกครั้ง)
```

**เบราว์เซอร์ไม่คุยกับ Supabase ตรงอีกแล้ว** ทุกการอ่านเขียนวิ่งผ่านฝั่ง server ด้วย secret key
ซึ่งข้าม RLS ได้ ตารางทั้งสามเปิด RLS ไว้แบบไม่มี policy เลย จึงปิดตายไม่ให้ anon key แตะอะไรได้

**กฎที่ห้ามละเมิด:**
- `src/lib/supabase.ts` มี `import "server-only"` ห้าม import จาก client component
- ห้ามสร้าง Supabase client ที่อื่นนอกจากไฟล์นั้น
- ห้ามตั้งชื่อ env ที่เก็บ secret ว่า `NEXT_PUBLIC_*` — Next.js จะฝังลง bundle แล้วรั่วทันที
- server action **ห้ามรับ `user_id` จาก client** ต้องอ่านจาก session เอง (ค่าจาก client ปลอมได้)
- proxy ทำแค่ optimistic check จาก cookie ตามที่เอกสาร Next แนะนำ การตรวจสิทธิ์จริงอยู่ใน action ทุกตัว

## โครงสร้าง

```
src/proxy.ts                    กันหน้าที่ยังไม่ login + ต่ออายุ session (sliding 30 นาที)
src/app/layout.tsx              ฟอนต์ Noto Sans Thai + metadata (lang="th")
src/app/page.tsx                server component: อ่าน session แล้วประกอบหน้าหลัก
src/app/login/                  หน้าเข้าสู่ระบบ
src/app/register/               หน้าลงทะเบียน (สร้างแบบรออนุมัติ)
src/app/admin/users/            จัดการบัญชี อนุมัติ เปลี่ยน role รีเซ็ตรหัสผ่าน (super admin)
src/app/admin/logs/             ประวัติการเข้าระบบ (super admin)
src/app/globals.css             design tokens ของ 9Expert CI

src/lib/supabase.ts             *** server-only *** จุดเชื่อมต่อฐานข้อมูลจุดเดียว
src/lib/session-token.ts        เข้ารหัส/ตรวจ session token (ไม่ import next — proxy ใช้ได้)
src/lib/session.ts              อ่านเขียน session cookie (server-only)
src/lib/roles.ts                แหล่งเดียวของกฎสิทธิ์ + ชื่อ role ภาษาไทย
src/lib/auth-rules.ts           ค่าคงที่รหัสผ่าน/เวลา idle (ไฟล์ธรรมดา client ใช้ได้)
src/lib/auth-actions.ts         login / logout / register
src/lib/expenses-actions.ts     CRUD รายจ่าย บังคับสิทธิ์ทุกครั้ง
src/lib/users-actions.ts        จัดการบัญชี + รีเซ็ตรหัสผ่าน (super admin)
src/lib/categories.ts           CATEGORIES, CATEGORY_COLOR, formatBaht, today
src/lib/types.ts                Expense, User, LoginLog, Role, SessionUser

src/components/ExpenseApp.tsx   client: state ของหน้าบันทึกรายจ่ายทั้งหมด
src/components/                 ExpenseForm / ExpenseTable / Filters / CategorySummary
                                UserBar / IdleLogout / LoginPopup / PasswordInput
                                UsersManager / EnvNotice / NoPermission
supabase/                       SQL script สำหรับรันใน Supabase SQL Editor
```

## สิทธิ์ 3 ระดับ

| role | เห็นรายจ่าย | จัดการบัญชี |
|---|---|---|
| `user` | เฉพาะของตัวเอง | ไม่ได้ |
| `admin` | ของทุกคน + แก้/ลบได้ | ไม่ได้ |
| `super_admin` | ของทุกคน + แก้/ลบได้ | อนุมัติ เปลี่ยน role ดูประวัติ รีเซ็ตรหัสผ่านของ `admin`/`user` |

เช็ก role ผ่านฟังก์ชันใน `src/lib/roles.ts` เท่านั้น (`canSeeAllExpenses`, `canManageUsers`,
`canResetPasswordOf`) **ห้ามเทียบสตริง role ตรง ๆ ที่อื่น**

สมัครเองได้ที่ `/register` แต่ `is_approved` เป็น `false` จึง login ไม่ได้จนกว่า super admin อนุมัติ

## กติกาที่ต้องรักษา

**สี** — ใช้เฉพาะ token ที่ประกาศใน `@theme` (`bg-brand`, `text-navy`, `ring-line`, `bg-mist` ฯลฯ)
ห้ามใส่ hex ตรง ๆ ใน className และ **ห้ามใช้โทนอุ่นทุกกรณี** (ส้ม แดง เหลือง อำพัน) — รวมถึงสีแจ้ง error
ด้วย ซึ่งในแอปนี้ใช้ `border-navy` + `bg-mist` แทนกรอบแดง

**หมวดค่าใช้จ่าย** — `CATEGORIES` ใน `src/lib/categories.ts` เป็นแหล่งเดียว มี 6 หมวด:
อาหาร เดินทาง ช้อปปิ้ง ค่าบ้าน สุขภาพ อื่น ๆ — ห้าม hardcode ชื่อหมวดที่อื่น และถ้าเพิ่มหมวดต้องเพิ่ม
สีใน `CATEGORY_COLOR` ด้วย

**ข้อความ UI** — ภาษาไทยทั้งหมด จำนวนเงินแสดงผ่าน `formatBaht()` เท่านั้น (คอมมาคั่นหลักพัน ทศนิยม 2 ตำแหน่ง ลงท้าย "บาท")

**คอมเมนต์ในโค้ด** — เขียนภาษาไทย ตามสไตล์ไฟล์ที่มีอยู่

**server action** — ไฟล์ที่ประกาศ `"use server"` ทุก export ต้องเป็นฟังก์ชัน `async`
ค่าคงที่ต้องแยกไปไฟล์ธรรมดา (เหตุที่มี `auth-rules.ts`) · action คืนผลเป็น
`{ ok: true, ... } | { ok: false, message }` ไม่ throw เพราะ production Next.js จะปิดข้อความ error จริง

## ฐานข้อมูล

3 ตาราง **เปิด RLS ทั้งหมดโดยไม่มี policy**

- `expenses` — `id`, `expense_date`, `category`, `amount` (numeric > 0), `note`, `created_at`,
  `user_id` (nullable · null คือ 10 แถวแรกที่บันทึกก่อนมีระบบผู้ใช้ เห็นได้เฉพาะ admin ขึ้นไป)
- `users` — `id`, `username` (unique), `password_hash` (bcrypt), `full_name`, `department`,
  `role`, `is_approved`, `created_at`
- `login_logs` — `id`, `user_id`, `username`, `action` (`login`/`logout`/`failed`/`password_reset`),
  `detail`, `ip`, `user_agent`, `created_at`

Script: [supabase/myexpense-seed.sql](supabase/myexpense-seed.sql) (ตาราง expenses — **ขึ้นต้นด้วย
`DROP TABLE` ห้ามรันซ้ำ**) และ [supabase/myexpense-auth.sql](supabase/myexpense-auth.sql)
(users + login_logs + เพิ่ม `user_id` — ไม่ลบข้อมูล expenses แต่รันซ้ำไม่ได้)

`amount` เป็น `numeric` PostgREST จึงส่งมาเป็น **ข้อความ** ต้อง `Number()` เสมอ ไม่งั้นการบวกยอด
จะกลายเป็นการต่อสตริง

## Environment variables

`.env.local` (ไม่ถูก commit) ต้องมี 3 ตัว:

| ตัวแปร | หมายเหตุ |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL โปรเจกต์ |
| `SUPABASE_SECRET_KEY` | secret/service_role key **ห้ามมี `NEXT_PUBLIC_`** |
| `SESSION_SECRET` | สุ่มยาว ≥32 ตัวอักษร ใช้เซ็น session cookie |

ค่าเดียวกันต้องไปตั้งเป็น Environment Variables บน Vercel ด้วย ไม่งั้น production จะขึ้นหน้า
"ยังตั้งค่าระบบไม่ครบ" · ตัวอย่างชื่อตัวแปรอยู่ใน `.env.local.example`

## คำสั่ง

```bash
npm install     # node_modules ไม่ได้อยู่ในโฟลเดอร์นี้ ต้องรันก่อนทุกครั้งที่ clone/คัดลอกมาใหม่
npm run dev
npm run build
npm run lint
```

สร้าง bcrypt hash สำหรับ insert บัญชีแรกด้วยมือ:
`node -e "require('bcryptjs').hash('รหัสผ่าน',10).then(console.log)"`

## Git และ Deploy

GitHub: https://github.com/momoj3/ExpenseDBAPP (branch `main`)

Vercel team `rattanapon` · project `myexpense` · production https://myexpense-rattanapon.vercel.app
ยังไม่ได้เชื่อม git integration จึง deploy ด้วยการส่งไฟล์ตรง (`deploy_to_vercel`) — ต้องส่ง source
ทั้งชุดทุกครั้ง · โปรเจกต์เปิด Vercel Authentication อยู่ URL จึงยัง redirect ไปหน้า login ของ Vercel

## ที่ทราบว่ายังไม่ถูก

`today()` และ default month ใช้ `new Date().toISOString()` ซึ่งเป็นเวลา UTC ไม่ใช่เวลาไทย (UTC+7)
ช่วงเที่ยงคืนถึง 07:00 ตามเวลาไทยจะได้วันที่ของ "เมื่อวาน" ทำให้ค่าเริ่มต้นในฟอร์มผิด และกฎ
"ห้ามเป็นวันในอนาคต" ใน `validate.ts` อาจปฏิเสธรายการของวันนี้

ESLint error ค้างอยู่ 1 จุดที่ `src/components/ExpenseForm.tsx:24` (`react-hooks/set-state-in-effect`)
มีมาตั้งแต่ก่อนเพิ่มระบบ login ยังไม่แก้

รีเซ็ตรหัสผ่านแล้ว **ไม่เตะ session เดิมทิ้งทันที** เพราะ session เป็น cookie ที่เซ็นแบบ stateless
เจ้าของบัญชีที่กำลังใช้งานอยู่จะใช้ต่อได้จนครบ 30 นาทีหรือกด logout เอง ถ้าต้องการให้เด้งออกทันที
ต้องเพิ่ม `password_changed_at` ใน `users` แล้วเทียบทุก action
