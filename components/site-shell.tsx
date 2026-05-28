"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const navItems = [
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];
const footerItems = [
  { href: "/", label: "Home" },
  ...navItems,
  { href: "/lapquest", label: "LapQuest" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLapquest = pathname?.startsWith("/lapquest");
  const isMissingCat = pathname === "/missingcat";
  const year = new Date().getFullYear();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const prevPath = prevPathRef.current;
    if (isLapquest && (!prevPath || !prevPath.startsWith("/lapquest"))) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
    prevPathRef.current = pathname;
  }, [isLapquest, pathname]);

  return (
    <>
      {!isLapquest && !isMissingCat && (
        <header className="border-b border-neutral-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-neutral-800 dark:bg-neutral-900/80 dark:supports-[backdrop-filter]:bg-neutral-900/70">
          <div className="flex w-full items-center justify-between px-4 py-4 sm:px-6">
            <Link href="/" className="text-base font-semibold">
              JH
            </Link>
            <nav className="flex items-center gap-4 sm:gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-neutral-700 transition hover:text-neutral-900 dark:text-neutral-200 dark:hover:text-neutral-50"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
      )}
      <main className={isLapquest ? "w-full" : "w-full px-4 py-10 sm:px-6"}>{children}</main>
      {!isMissingCat && (
        <footer className="border-t border-neutral-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-neutral-800 dark:bg-neutral-900/80 dark:supports-[backdrop-filter]:bg-neutral-900/70">
          <div className="flex w-full flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
              © {year} Jacob Huber
            </div>
            <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-neutral-700 dark:text-neutral-200">
              {footerItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-neutral-900 dark:hover:text-neutral-50"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </footer>
      )}
    </>
  );
}
