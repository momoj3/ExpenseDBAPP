// กฎเกี่ยวกับรหัสผ่านและชื่อผู้ใช้ แยกไว้เป็นไฟล์ธรรมดา
//
// เหตุที่ไม่เก็บค่าเหล่านี้ในไฟล์ "use server": Next.js บังคับว่าไฟล์ที่ประกาศ
// "use server" ต้อง export เป็นฟังก์ชัน async เท่านั้น จะ export ค่าคงที่ไม่ได้

// ไฟล์นี้ต้องไม่ import อะไรจาก node หรือ next เพราะ client component ใช้ด้วย

// ไม่มีการเคลื่อนไหวนานเท่านี้แล้วออกจากระบบอัตโนมัติ (ครึ่งชั่วโมง)
// ต้องตรงกับ SESSION_MAX_AGE_SECONDS ใน session-token.ts
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

// ความยาวรหัสผ่านขั้นต่ำ ใช้ทั้งตอนสมัครและตอน super admin รีเซ็ตรหัสผ่าน
export const PASSWORD_MIN_LENGTH = 8;

// จำนวนรอบของ bcrypt ยิ่งมากยิ่งช้าและยิ่งปลอดภัย 10 เป็นค่าที่ใช้กันทั่วไป
export const BCRYPT_ROUNDS = 10;

// ชื่อผู้ใช้ใช้ได้เฉพาะตัวอักษรอังกฤษ ตัวเลข จุด ขีดกลาง ขีดล่าง
export const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;
export const USERNAME_MIN_LENGTH = 3;

// ตรวจรหัสผ่านใหม่ คืนข้อความเตือนภาษาไทย หรือ null ถ้าผ่าน
export function validateNewPassword(password: string, confirm: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `รหัสผ่านต้องยาวอย่างน้อย ${PASSWORD_MIN_LENGTH} ตัวอักษร`;
  }
  if (password !== confirm) {
    return "รหัสผ่านทั้งสองช่องไม่ตรงกัน";
  }
  return null;
}
