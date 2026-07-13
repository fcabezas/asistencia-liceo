"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";

type NavLink = { href: string; label: string };

export default function DashboardShell({
  title,
  links,
  children,
}: {
  title: string;
  links: NavLink[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <header className="flex items-center justify-between bg-brand-900 px-4 py-3 text-white md:hidden">
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <div className="leading-tight">
            <p className="text-sm font-semibold">Liceo Eduardo Charme</p>
            <p className="text-xs text-brand-300">{title}</p>
          </div>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          className="rounded p-2 hover:bg-brand-800"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      <nav
        className={`${open ? "block" : "hidden"} w-full shrink-0 bg-brand-900 px-3 py-4 text-white md:block md:w-60 md:px-3 md:py-6`}
      >
        <div className="mb-4 hidden items-center gap-2 px-1 md:flex">
          <Logo size={32} />
          <div className="leading-tight">
            <p className="text-sm font-semibold">Liceo Eduardo Charme</p>
            <p className="text-xs text-brand-300">{title}</p>
          </div>
        </div>
        <ul className="flex flex-col gap-1">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-gold-500 font-semibold text-brand-950"
                      : "text-brand-100 hover:bg-brand-800"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <main className="min-w-0 flex-1 bg-white dark:bg-brand-950">{children}</main>
    </div>
  );
}
