"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/meetings", label: "פגישות" },
  { href: "/students", label: "תלמידים" },
  { href: "/teachers", label: "מורים" },
  { href: "/inquiries", label: "פניות" },
  { href: "/classes", label: "כיתות" },
  { href: "/mapping", label: "מיפוי" },
  { href: "/import", label: "ייבוא" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="navbar-brand-mark" aria-hidden="true">
          י
        </span>
        <span className="navbar-brand-text">מערכת היועץ החינוכי</span>
      </div>

      <nav className="navbar-links">
        {LINKS.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`navbar-link${isActive ? " navbar-link-active" : ""}`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <form action="/api/auth/logout" method="post">
        <button type="submit" className="navbar-logout">
          התנתקות
        </button>
      </form>
    </header>
  );
}
