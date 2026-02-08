import type { ReactNode } from "react";
import { SUPERBOWL_HERO_IMAGE_URL } from "@/lib/superbowl";

type SuperbowlHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  children?: ReactNode;
};

export function SuperbowlHeader({
  title,
  description,
  eyebrow = "Super Bowl Props",
  children,
}: SuperbowlHeaderProps) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/85 px-6 py-10 dark:border-zinc-900 dark:bg-black/80 sm:px-10 sm:py-12"
      style={{
        backgroundImage: `url('${SUPERBOWL_HERO_IMAGE_URL}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
      </div>
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.5em] text-white/80">
            {eyebrow}
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 text-base text-white/80 drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
              {description}
            </p>
          ) : null}
        </div>
        {children ? <div className="flex flex-wrap gap-3">{children}</div> : null}
      </div>
    </section>
  );
}
