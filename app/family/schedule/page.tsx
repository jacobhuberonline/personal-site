import type { Metadata } from "next";
import { Suspense } from "react";

import ScheduleClient from "./schedule-client";

const shareImage = "/images/francis-card.png";

export const metadata: Metadata = {
  title: "Francis's Daily Plan",
  description:
    "Live schedule with feeds, naps, play, and bedtime so you always know what Francis should be doing right now and what’s next.",
  openGraph: {
    title: "Francis's Daily Plan",
    description:
      "Live view of Francis's day with the current activity highlighted and the next activity shown for you.",
    type: "article",
    url: "/family/schedule",
    images: [
      {
        url: shareImage,
        width: 1200,
        height: 630,
        alt: "Francis's daily baby schedule overview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Francis's Daily Plan",
    description:
      "Check Francis's live schedule to see what he’s doing now and what comes next.",
    images: [shareImage],
  },
};

export default function SchedulePage() {
  return (
    <Suspense fallback={<ScheduleFallback />}>
      <ScheduleClient />
    </Suspense>
  );
}

function ScheduleFallback() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10 text-sm text-muted-foreground sm:px-6">
      Loading Francis&apos;s plan…
    </main>
  );
}
