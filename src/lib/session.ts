import "server-only";

import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createToken,
  verifyToken,
} from "./session-token";
import type { SessionUser } from "./types";

// อ่านเขียน session cookie จากฝั่ง server เท่านั้น
// cookie เป็น httpOnly เพื่อให้ JavaScript ในเบราว์เซอร์อ่านไม่ได้

export async function createSession(user: SessionUser): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, createToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

// คืนผู้ใช้ที่กำลังเข้าสู่ระบบ หรือ null ถ้ายังไม่ได้เข้าหรือหมดอายุแล้ว
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifyToken(store.get(SESSION_COOKIE)?.value);
}

// ใช้ในทุก server action ที่ต้องมีสิทธิ์ — ไม่มี session ถือว่าเรียกไม่ได้
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("กรุณาเข้าสู่ระบบก่อนใช้งาน");
  return user;
}
