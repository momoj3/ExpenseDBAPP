-- ============================================================
-- MyExpense : เพิ่มระบบผู้ใช้และสิทธิ์การเข้าใช้งาน
-- คัดลอกทั้งไฟล์นี้ไปวางใน SQL Editor ของ Supabase แล้วกด Run
--
-- *** สำคัญ ***
-- script นี้ไม่ลบตาราง expenses ที่มีข้อมูลจริงอยู่แล้ว
-- แต่ส่วนสร้างตาราง users / login_logs รันซ้ำไม่ได้ ถ้าต้องการรันซ้ำ
-- ต้องลบสองตารางนั้นทิ้งเองก่อน (ดูคำสั่งท้ายไฟล์)
-- ============================================================

-- ------------------------------------------------------------
-- 1) ตารางผู้ใช้
-- ------------------------------------------------------------
create table public.users (
  id            bigint generated always as identity primary key,
  username      text        not null unique,
  password_hash text        not null,
  full_name     text        not null,
  department    text,
  role          text        not null default 'user'
                            check (role in ('super_admin', 'admin', 'user')),
  is_approved   boolean     not null default false,
  created_at    timestamptz not null default now()
);

comment on table  public.users               is 'ตารางผู้ใช้ของแอป MyExpense เก็บ 1 แถวต่อ 1 บัญชี';
comment on column public.users.id            is 'รหัสประจำบัญชี สร้างค่าอัตโนมัติ ใช้เป็น primary key';
comment on column public.users.username      is 'ชื่อผู้ใช้สำหรับเข้าสู่ระบบ ห้ามซ้ำและห้ามว่าง';
comment on column public.users.password_hash is 'รหัสผ่านที่เข้ารหัสด้วย bcrypt แล้ว ไม่เคยเก็บรหัสผ่านจริง';
comment on column public.users.full_name     is 'ชื่อ-สกุลของผู้ใช้ ใช้แสดงใน popup หลังเข้าสู่ระบบ';
comment on column public.users.department    is 'หน่วยงานที่ผู้ใช้สังกัด ปล่อยว่างได้';
comment on column public.users.role          is 'ระดับสิทธิ์ super_admin จัดการบัญชีได้ admin ดูและแก้ของทุกคนได้ user เห็นเฉพาะของตัวเอง';
comment on column public.users.is_approved   is 'อนุมัติแล้วหรือยัง สมัครใหม่จะเป็น false และเข้าสู่ระบบไม่ได้จนกว่า super admin อนุมัติ';
comment on column public.users.created_at    is 'เวลาที่สมัครบัญชีนี้ บันทึกอัตโนมัติ';

-- ------------------------------------------------------------
-- 2) ตารางประวัติการเข้าสู่ระบบ
-- ------------------------------------------------------------
create table public.login_logs (
  id         bigint generated always as identity primary key,
  user_id    bigint      references public.users(id) on delete set null,
  username   text        not null,
  action     text        not null
                         check (action in ('login', 'logout', 'failed', 'password_reset')),
  detail     text,
  ip         text,
  user_agent text,
  created_at timestamptz not null default now()
);

comment on table  public.login_logs            is 'ประวัติการเข้าและออกจากระบบ เก็บ 1 แถวต่อ 1 เหตุการณ์';
comment on column public.login_logs.id         is 'รหัสประจำแถว สร้างค่าอัตโนมัติ ใช้เป็น primary key';
comment on column public.login_logs.user_id    is 'บัญชีที่เกี่ยวข้อง ถ้าบัญชีถูกลบจะกลายเป็น null แต่แถวประวัติยังอยู่';
comment on column public.login_logs.username   is 'สำเนาชื่อผู้ใช้ ณ เวลานั้น เก็บไว้เพื่อให้อ่านประวัติได้แม้บัญชีถูกลบ';
comment on column public.login_logs.action     is 'ประเภทเหตุการณ์ login เข้าสำเร็จ logout ออกจากระบบ failed รหัสผ่านผิดหรือยังไม่อนุมัติ password_reset ถูกรีเซ็ตรหัสผ่าน';
comment on column public.login_logs.detail     is 'รายละเอียดเพิ่มเติม เช่น สาเหตุที่เข้าไม่ได้ หรือชื่อผู้ที่กดรีเซ็ตรหัสผ่าน';
comment on column public.login_logs.ip         is 'หมายเลข IP ของผู้ใช้ อาจเป็น null ถ้าอ่านไม่ได้';
comment on column public.login_logs.user_agent is 'ข้อมูลเบราว์เซอร์ของผู้ใช้ อาจเป็น null';
comment on column public.login_logs.created_at is 'เวลาที่เกิดเหตุการณ์ บันทึกอัตโนมัติ';

-- ------------------------------------------------------------
-- 3) ผูกรายจ่ายกับเจ้าของ
--    ยอมให้เป็น null เพราะรายจ่ายที่บันทึกไว้ก่อนมีระบบผู้ใช้ยังไม่มีเจ้าของ
--    แถวที่ user_id เป็น null จะเห็นได้เฉพาะ admin และ super admin
-- ------------------------------------------------------------
alter table public.expenses
  add column user_id bigint references public.users(id);

comment on column public.expenses.user_id is 'เจ้าของรายจ่าย อ้างถึง users.id · null คือรายการเก่าที่บันทึกก่อนมีระบบผู้ใช้';

create index expenses_user_id_idx  on public.expenses (user_id);
create index login_logs_user_idx   on public.login_logs (user_id, created_at desc);

-- ------------------------------------------------------------
-- 4) เปิด Row Level Security ทั้งสามตาราง โดยไม่ใส่ policy เลย
--
--    แอปเข้าถึงฐานข้อมูลจากฝั่ง server ด้วย secret key ซึ่งข้าม RLS ได้
--    การเปิด RLS แบบไม่มี policy จึงเท่ากับปิดตายไม่ให้ anon key
--    (key ที่ฝังอยู่ในเบราว์เซอร์) อ่านหรือเขียนอะไรได้เลย
-- ------------------------------------------------------------
alter table public.users      enable row level security;
alter table public.login_logs enable row level security;
alter table public.expenses   enable row level security;

-- ------------------------------------------------------------
-- 5) สร้างบัญชี super admin คนแรก
--
--    ต้องใส่ค่า hash ของรหัสผ่านเอง เพราะ SQL นี้ไม่มีฟังก์ชัน bcrypt
--    สร้าง hash ด้วยคำสั่งนี้ที่โฟลเดอร์โปรเจกต์ (แทน your-password ด้วยรหัสที่ต้องการ)
--
--      node -e "require('bcryptjs').hash('your-password',10).then(console.log)"
--
--    แล้วนำค่าที่ได้ (ขึ้นต้นด้วย $2b$10$) มาวางแทน PASTE_BCRYPT_HASH_HERE
-- ------------------------------------------------------------
insert into public.users (username, password_hash, full_name, department, role, is_approved)
values ('superadmin', 'PASTE_BCRYPT_HASH_HERE', 'ผู้ดูแลระบบสูงสุด', 'ส่วนกลาง', 'super_admin', true);

-- ------------------------------------------------------------
-- ตรวจผลลัพธ์
-- ------------------------------------------------------------
select id, username, full_name, department, role, is_approved from public.users;

-- ------------------------------------------------------------
-- ถ้าต้องการรัน script นี้ซ้ำ ให้รันสามคำสั่งนี้ก่อน
-- (ข้อมูลผู้ใช้และประวัติการเข้าระบบจะหายทั้งหมด ส่วนรายจ่ายยังอยู่)
--
--   alter table public.expenses drop column if exists user_id;
--   drop table if exists public.login_logs;
--   drop table if exists public.users;
-- ------------------------------------------------------------
