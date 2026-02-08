import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SUPERBOWL_META_IMAGE_ALT, SUPERBOWL_META_IMAGE_URL } from "@/lib/superbowl";

export const metadata: Metadata = {
  title: "Super Bowl Props",
  description:
    "Make your Super Bowl LX picks, lock them in, and check the leaderboard after kickoff.",
  openGraph: {
    title: "Super Bowl Props",
    description:
      "Make your Super Bowl LX picks, lock them in, and check the leaderboard after kickoff.",
    url: "/superbowl",
    type: "website",
    images: [
      {
        url: SUPERBOWL_META_IMAGE_URL,
        alt: SUPERBOWL_META_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Super Bowl Props",
    description:
      "Make your Super Bowl LX picks, lock them in, and check the leaderboard after kickoff.",
    images: [SUPERBOWL_META_IMAGE_URL],
  },
};

export default function SuperbowlLayout({ children }: { children: ReactNode }) {
  return <div className="w-full">{children}</div>;
}
