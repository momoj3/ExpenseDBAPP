import { createHmac, timingSafeEqual } from "node:crypto";
import type { Role, SessionUser } from "./types";

// การเข้ารหัสและตรวจ session token — ไฟล์นี้ตั้งใจไม่ import อะไรจาก next
// เพื่อให้ proxy.ts เรียกใช้ได้ (proxy ห้ามพึ่งพา next/headers)
// ส่วนการอ่านเขียน cookie จริงอยู่ใน session.ts

export const SESSION_COOKIE = "myexpense_session";

// ไม่มีการเคลื่อนไหว 30 นาที ถือว่าหมดอายุ
export const SESSION_MAX_AGE_SECONDS = 30 * 60;

const secret = process.env.SESSION_SECRET;

export const isSessionConfigured = Boolean(secret && secret.length >= 32);

function base64url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function sign(payloadB64: string): string {
  return createHmac("sha256", secret as string).update(payloadB64).digest("base64url");
}

// สร้าง token ใหม่ที่หมดอายุอีก 30 นาทีจากนี้
export function createToken(user: SessionUser): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payloadB64 = base64url(JSON.stringify({ ...user, exp }));
  return `${payloadB64}.${sign(payloadB64)}`;
}

// ตรวจ token แล้วคืนข้อมูลผู้ใช้ ถ้าลายเซ็นผิดหรือหมดอายุคืน null
export function verifyToken(token: string | undefined): SessionUser | null {
  if (!isSessionConfigured || !token) return null;

  const dot = token.indexOf(".");
  if (dot < 1) return null;

  const payloadB64 = token.slice(0, dot);
  const signatureB64 = token.slice(dot + 1);

  // เทียบลายเซ็นแบบ timing-safe ต้องความยาวเท่ากันก่อน ไม่งั้น timingSafeEqual จะ throw
  const expected = Buffer.from(sign(payloadB64), "utf8");
  const actual = Buffer.from(signatureB64, "utf8");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) return null;

    return {
      userId: payload.userId as number,
      username: payload.username as string,
      fullName: payload.fullName as string,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}
