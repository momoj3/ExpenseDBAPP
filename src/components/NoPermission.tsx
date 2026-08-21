import Link from "next/link";

// แสดงเมื่อผู้ใช้เข้าสู่ระบบแล้วแต่ไม่มีสิทธิ์เปิดหน้านั้น
export default function NoPermission() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-line">
        <h1 className="text-lg font-semibold text-navy">ไม่มีสิทธิ์เข้าหน้านี้</h1>
        <p className="mt-3 text-ink-strong">
          หน้านี้เปิดได้เฉพาะผู้ดูแลระบบสูงสุด หากต้องการเข้าใช้งานกรุณาติดต่อผู้ดูแลระบบ
        </p>
        <Link
          href="/"
          className="mt-5 inline-block rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-deep"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    </main>
  );
}
