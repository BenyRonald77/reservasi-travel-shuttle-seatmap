"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/booking", label: "Booking" },
  { href: "/pembatalan", label: "Pembatalan" },
  { href: "/keberangkatan", label: "Keberangkatan" },
  { href: "/rute", label: "Rute" },
  { href: "/armada", label: "Armada" },
  { href: "/refund-rules", label: "Aturan Refund" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="no-print bg-sky-800 text-white shadow">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-3">
        <span className="mr-4 font-bold text-lg">🚌 TravelKu</span>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded px-3 py-1.5 text-sm hover:bg-sky-700 ${
              pathname === l.href ? "bg-sky-600 font-semibold" : ""
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
