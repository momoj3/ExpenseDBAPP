import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createToken,
  isSessionConfigured,
  verifyToken,
} from "@/lib/session-token";

// Next.js 16 เปลี่ยนชื่อ middleware เป็น proxy แล้ว (middleware.ts ถูก deprecate)
// proxy ใช้ Node.js runtime เป็นค่าเริ่มต้น และห้ามตั้งค่า runtime เอง ไม่งั้นจะ error
//
// ที่นี่ทำแค่การตรวจแบบเร็วจาก cookie ตามที่เอกสาร Next แนะนำ (optimistic check)
// ไม่แตะฐานข้อมูล เพราะ proxy ทำงานทุก request รวมถึง request ที่ Next prefetch ไว้ล่วงหน้า
// การตรวจสิทธิ์จริงอยู่ใน server action ทุกตัวอีกชั้นหนึ่ง

// หน้าที่เข้าได้โดยยังไม่ต้องเข้าสู่ระบบ
const PUBLIC_PATHS = ["/login", "/register"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ยังตั้งค่า SESSION_SECRET ไม่ครบ — ปล่อยผ่านเพื่อให้หน้าแอปแสดงวิธีตั้งค่า
  // ถ้า redirect ไป /login ตอนนี้จะวนไม่จบเพราะหน้า login ก็ทำงานไม่ได้
  if (!isSessionConfigured) return NextResponse.next();

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const user = verifyToken(request.cookies.get(SESSION_COOKIE)?.value);

  // ยังไม่ได้เข้าสู่ระบบ แล้วพยายามเปิดหน้าที่ต้องเข้าสู่ระบบ
  if (!user && !isPublic) {
    const target = new URL("/login", request.url);
    // จำหน้าที่อยากไปไว้ เข้าสู่ระบบเสร็จจะพากลับมาที่เดิม
    if (pathname !== "/") target.searchParams.set("next", pathname);
    return NextResponse.redirect(target);
  }

  // เข้าสู่ระบบอยู่แล้ว ไม่ต้องเห็นหน้า login หรือหน้าสมัครอีก
  if (user && isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const response = NextResponse.next();

  // ต่ออายุ session ทุกครั้งที่มีการใช้งาน (sliding expiration)
  // นับ 30 นาทีใหม่จากการเคลื่อนไหวครั้งล่าสุด ไม่ใช่จากตอนเข้าสู่ระบบ
  if (user) {
    response.cookies.set(SESSION_COOKIE, createToken(user), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  }

  return response;
}

export const config = {
  // ไม่ใส่ matcher เลย proxy จะทำงานกับทุก request รวมถึงไฟล์ static
  // ทำให้ CSS รูป และ JS โหลดไม่ได้ จึงต้องยกเว้นไว้
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
