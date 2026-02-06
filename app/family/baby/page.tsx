import type { Metadata } from "next";
import { Suspense } from "react";

import ScheduleClient from "./schedule-client";

const shareImage = "/images/baby-schedule-og.png";

export const metadata: Metadata = {
  title: "Baby Schedule",
  description:
    "Live schedule with feeds, naps, play, and bedtime so you always know what the baby should be doing right now and what’s next.",
  openGraph: {
    title: "Baby Schedule",
    description:
      "Live view of the baby’s day with the current activity highlighted and the next activity shown for you.",
    type: "article",
    url: "/family/baby",
    images: [
      {
        url: shareImage,
        width: 1200,
        height: 630,
        alt: "Baby schedule overview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Baby Schedule",
    description:
      "Check the baby’s live schedule to see what they’re doing now and what comes next.",
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
      Loading baby schedule…
    </main>
  );
}
