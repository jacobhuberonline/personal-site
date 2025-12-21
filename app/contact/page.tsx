import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
        Contact
      </h1>
      <p className="text-neutral-700 dark:text-neutral-200">
        Let&apos;s connect. Feel free to reach out about work, collaboration, or
        just to say hello.
      </p>
      <div className="max-w-xl rounded-2xl border border-neutral-200/70 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-neutral-800/70 dark:bg-neutral-900/80">
        <ul className="space-y-4 text-sm text-neutral-800 dark:text-neutral-100">
          <li className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Email
            </span>
            <a
              href="mailto:jacob-huber@outlook.com"
              className="text-base font-medium underline decoration-neutral-300 underline-offset-4 transition hover:decoration-neutral-500 dark:decoration-neutral-600 dark:hover:decoration-neutral-300"
            >
              jacob-huber@outlook.com
            </a>
          </li>
          <li className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              GitHub
            </span>
            <Link
              href="https://github.com/jacobhuberonline"
              className="text-base font-medium underline decoration-neutral-300 underline-offset-4 transition hover:decoration-neutral-500 dark:decoration-neutral-600 dark:hover:decoration-neutral-300"
            >
              github.com/jacobhuberonline
            </Link>
          </li>
          <li className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              X
            </span>
            <Link
              href="https://x.com/jacobhuberonlin"
              className="text-base font-medium underline decoration-neutral-300 underline-offset-4 transition hover:decoration-neutral-500 dark:decoration-neutral-600 dark:hover:decoration-neutral-300"
            >
              x.com/jacobhuberonlin
            </Link>
          </li>
          <li className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              LinkedIn
            </span>
            <Link
              href="https://www.linkedin.com/in/jacobhuberonline/"
              className="text-base font-medium underline decoration-neutral-300 underline-offset-4 transition hover:decoration-neutral-500 dark:decoration-neutral-600 dark:hover:decoration-neutral-300"
            >
              linkedin.com/in/jacobhuberonline
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
