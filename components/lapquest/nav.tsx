"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/lapquest/setup", label: "Setup", requiresAuth: false },
  { href: "/lapquest/history", label: "My runs", requiresAuth: true },
];

export function LapquestNav() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      if (!supabase) return;
      const session = await supabase.auth.getSession();
      if (!isActive) return;
      setSignedIn(Boolean(session.data.session));
    };
    void load();
    const { data } = supabase?.auth.onAuthStateChange((_event, session) => {
      if (!isActive) return;
      setSignedIn(Boolean(session));
    }) ?? { data: null };
    return () => {
      isActive = false;
      data?.subscription.unsubscribe();
    };
  }, []);

  const handleAuthClick = async () => {
    if (!supabase) return;
    if (signedIn) {
      await supabase.auth.signOut();
      window.location.href = "/lapquest";
      return;
    }
    window.location.href = "/lapquest/login";
  };

  const handleProtectedNav = useCallback(
    async (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (signedIn) return;
      event.preventDefault();
      if (!supabase) {
        window.location.href = "/lapquest/login";
        return;
      }
      if (signedIn === null) {
        const session = await supabase.auth.getSession();
        const authed = Boolean(session.data.session);
        setSignedIn(authed);
        window.location.href = authed ? href : "/lapquest/login";
        return;
      }
      window.location.href = "/lapquest/login";
    },
    [signedIn]
  );

  return (
    <div className="w-full border-b border-slate-200 bg-white text-slate-900 dark:border-zinc-900 dark:bg-black dark:text-white">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3">
        <Link
          href="/lapquest"
          className="flex items-center gap-3 text-lg font-semibold text-slate-700 dark:text-zinc-200"
        >
          <img src="/lapquest/icon.svg" alt="LapQuest" className="h-7 w-7" />
          <span className="tracking-[0.3em] uppercase">LapQuest</span>
        </Link>
        <nav className="ml-auto flex flex-wrap items-center gap-2 text-sm font-semibold">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={item.requiresAuth ? (event) => void handleProtectedNav(event, item.href) : undefined}
                className={cn(
                  "rounded-full border px-3 py-1 transition",
                  active
                    ? "border-slate-300 bg-slate-100 text-slate-900 dark:border-white/40 dark:bg-white/10 dark:text-white"
                    : "border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900 dark:border-white/10 dark:text-zinc-300 dark:hover:border-white/30 dark:hover:text-white"
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleAuthClick}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-white/10 dark:text-zinc-300 dark:hover:border-white/30 dark:hover:text-white"
          >
            {signedIn ? "Log out" : "Log in"}
          </button>
        </nav>
      </div>
    </div>
  );
}
