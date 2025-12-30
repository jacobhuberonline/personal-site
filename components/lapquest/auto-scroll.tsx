"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function LapquestAutoScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const scrollToOffset = () => {
      window.scrollTo({ top: 80, left: 0, behavior: "auto" });
    };
    let rafId = 0;
    const id = window.setTimeout(() => {
      scrollToOffset();
      rafId = requestAnimationFrame(scrollToOffset);
    }, 120);
    return () => {
      window.clearTimeout(id);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [pathname]);

  return null;
}
