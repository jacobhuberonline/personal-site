"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/lapquest/setup", label: "Setup" },
  { href: "/lapquest/history", label: "My runs" },
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
    <div className="w-full border-b border-zinc-900 bg-black text-white">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3">
        <Link href="/lapquest" className="flex items-center gap-3 text-lg font-semibold text-zinc-200">
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
                onClick={(event) => void handleProtectedNav(event, item.href)}
                className={cn(
                  "rounded-full border px-3 py-1 transition",
                  active
                    ? "border-white/40 bg-white/10 text-white"
                    : "border-white/10 text-zinc-300 hover:border-white/30 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleAuthClick}
            className="rounded-full border border-white/10 px-3 py-1 text-sm font-semibold text-zinc-300 transition hover:border-white/30 hover:text-white"
          >
            {signedIn ? "Log out" : "Log in"}
          </button>
        </nav>
      </div>
    </div>
  );
}
