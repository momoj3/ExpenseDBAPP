"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth-actions";
import { IDLE_TIMEOUT_MS } from "@/lib/auth-rules";

// ออกจากระบบอัตโนมัติเมื่อไม่มีการเคลื่อนไหวครบครึ่งชั่วโมง
//
// ทำไมต้องมีตัวจับเวลาฝั่งเบราว์เซอร์ ทั้งที่ cookie ก็หมดอายุ 30 นาทีอยู่แล้ว:
// ถ้าผู้ใช้เปิดหน้าจอค้างไว้เฉย ๆ จะไม่มี request วิ่งไป server เลย proxy จึงไม่มีโอกาส
// ต่ออายุหรือตัด session ตัวจับเวลานี้จึงเป็นชั้นที่ทำให้เด้งออกจริงตามเวลา
// ส่วนอายุ cookie เป็นชั้นสำรองฝั่ง server
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];

export default function IdleLogout() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function signOutByIdle() {
      await logout();
      // บอกหน้า login ว่าถูกเด้งออกเพราะไม่มีการเคลื่อนไหว
      router.push("/login?reason=idle");
    }

    function restart() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(signOutByIdle, IDLE_TIMEOUT_MS);
    }

    restart();
    for (const name of ACTIVITY_EVENTS) {
      window.addEventListener(name, restart, { passive: true });
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const name of ACTIVITY_EVENTS) {
        window.removeEventListener(name, restart);
      }
    };
  }, [router]);

  // ตัวนี้ไม่แสดงอะไรบนหน้าจอ ทำหน้าที่จับเวลาเท่านั้น
  return null;
}
