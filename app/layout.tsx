import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { SiteShell } from "@/components/site-shell";
import { LapquestLoginRedirect } from "@/components/lapquest/login-redirect";
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen overflow-x-hidden bg-neutral-50 text-neutral-900 transition-colors duration-200 dark:bg-neutral-950 dark:text-neutral-50">
        <ThemeProvider>
          <LapquestLoginRedirect />
          <SiteShell>{children}</SiteShell>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
