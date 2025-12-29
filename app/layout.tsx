import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://jacobhuber.vercel.app"),
  title: {
    default: "Jacob Huber · Software Engineer",
    template: "%s · Jacob Huber",
  },
  description:
    "Software engineer focused on healthcare data integrations, API-driven automation, and modern web tooling. Personal projects, notes, and experiments in one place.",
  keywords: [
    "Jacob Huber",
    "software engineer",
    "healthcare data",
    "API integrations",
    "address validation",
    "Next.js",
    ".NET",
  ],
  authors: [{ name: "Jacob Huber" }],
  openGraph: {
    title: "Jacob Huber · Software Engineer",
    description:
      "Software engineer focused on healthcare data integrations, API-driven automation, and modern web tooling.",
    url: "https://jacobhuber.vercel.app",
    siteName: "Jacob Huber",
    type: "website",
    images: [
      {
        url: "/images/default-social.png",
        width: 1200,
        height: 630,
        alt: "Jacob Huber personal site",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jacob Huber · Software Engineer",
    description:
      "Healthcare data integrations, API-driven automation, and modern web projects.",
    images: ["/images/default-social.png"],
  },
};

const navItems = [
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen overflow-x-hidden bg-neutral-50 text-neutral-900 transition-colors duration-200 dark:bg-neutral-950 dark:text-neutral-50">
        <ThemeProvider>
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
          <main className="w-full px-4 py-10 sm:px-6">{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
