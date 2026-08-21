"use server";

import { headers } from "next/headers";
import { compare, hash } from "bcryptjs";
import { BCRYPT_ROUNDS, USERNAME_MIN_LENGTH, USERNAME_PATTERN, validateNewPassword } from "./auth-rules";
import { createSession, destroySession, getSessionUser } from "./session";
import { findUserForLogin, insertPendingUser, writeLoginLog } from "./supabase";

// ทุกฟังก์ชันในไฟล์นี้ทำงานฝั่ง server เท่านั้น
//
// คืนผลเป็นอ็อบเจกต์ ไม่ throw เพราะตอน production Next.js จะปิดข้อความ error จริง
// ของ server action ทำให้ผู้ใช้เห็นแต่ข้อความกลาง ๆ ที่อ่านไม่รู้เรื่อง
//
// หมายเหตุ: ไฟล์ "use server" ทุก export ต้องเป็นฟังก์ชัน async
// ค่าคงที่ทั้งหมดจึงอยู่ใน auth-rules.ts

export type ActionResult = { ok: true } | { ok: false; message: string };

// อ่าน IP และเบราว์เซอร์ของผู้ใช้ไว้เก็บลงประวัติ
async function requestInfo(): Promise<{ ip: string; userAgent: string }> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for") ?? "";
  return {
    ip: forwarded.split(",")[0].trim() || h.get("x-real-ip") || "",
    userAgent: h.get("user-agent") ?? "",
  };
}

export async function login(username: string, password: string): Promise<ActionResult> {
  const name = username.trim();
  if (!name || !password) {
    return { ok: false, message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" };
  }

  const info = await requestInfo();

  try {
    const user = await findUserForLogin(name);

    // ไม่พบบัญชี หรือรหัสผ่านผิด — ตอบข้อความเดียวกันทั้งสองกรณี
    // เพื่อไม่ให้คนเดารู้ว่าชื่อผู้ใช้ไหนมีอยู่จริง
    if (!user || !(await compare(password, user.password_hash))) {
      await writeLoginLog({
        userId: user?.id ?? null,
        username: name,
        action: "failed",
        detail: user ? "รหัสผ่านไม่ถูกต้อง" : "ไม่พบชื่อผู้ใช้นี้",
        ...info,
      });
      return { ok: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
    }

    if (!user.is_approved) {
      await writeLoginLog({
        userId: user.id,
        username: name,
        action: "failed",
        detail: "บัญชียังไม่ได้รับอนุมัติ",
        ...info,
      });
      return {
        ok: false,
        message: "บัญชีนี้ยังไม่ได้รับอนุมัติ กรุณาติดต่อผู้ดูแลระบบเพื่อขออนุมัติก่อนเข้าใช้งาน",
      };
    }

    await createSession({
      userId: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
    });

    await writeLoginLog({ userId: user.id, username: name, action: "login", ...info });
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function logout(): Promise<ActionResult> {
  try {
    const user = await getSessionUser();
    if (user) {
      const info = await requestInfo();
      await writeLoginLog({
        userId: user.userId,
        username: user.username,
        action: "logout",
        ...info,
      });
    }
    await destroySession();
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function register(input: {
  username: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  department: string;
}): Promise<ActionResult> {
  const username = input.username.trim();
  const fullName = input.fullName.trim();

  if (username.length < USERNAME_MIN_LENGTH) {
    return { ok: false, message: `ชื่อผู้ใช้ต้องยาวอย่างน้อย ${USERNAME_MIN_LENGTH} ตัวอักษร` };
  }
  if (!USERNAME_PATTERN.test(username)) {
    return { ok: false, message: "ชื่อผู้ใช้ใช้ได้เฉพาะ a-z A-Z 0-9 จุด ขีดกลาง และขีดล่าง" };
  }
  if (!fullName) {
    return { ok: false, message: "กรุณากรอกชื่อ-สกุล" };
  }

  const passwordError = validateNewPassword(input.password, input.confirmPassword);
  if (passwordError) return { ok: false, message: passwordError };

  try {
    await insertPendingUser({
      username,
      passwordHash: await hash(input.password, BCRYPT_ROUNDS),
      fullName,
      department: input.department,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
