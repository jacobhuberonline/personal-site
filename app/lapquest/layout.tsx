import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LapquestSerialProvider } from "@/components/lapquest/serial-provider";
import { LapquestNav } from "@/components/lapquest/nav";

export const metadata: Metadata = {
  title: "LapQuest",
  description:
    "LapQuest turns your hallway, backyard, or driveway into a mini race track with live lap counting and race challenges.",
  openGraph: {
    title: "LapQuest",
    description:
      "Turn any space into a mini race track with live lap counting, countdowns, and saved runs.",
    url: "/lapquest",
    type: "website",
    images: [
      {
        url: "/lapquest/hero.png",
        width: 1536,
        height: 1024,
        alt: "LapQuest running game hero image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LapQuest",
    description:
      "Turn any space into a mini race track with live lap counting, countdowns, and saved runs.",
    images: ["/lapquest/hero.png"],
  },
};

export default function LapquestLayout({ children }: { children: ReactNode }) {
  return (
    <LapquestSerialProvider>
      <div className="w-full">
        <LapquestNav />
        <div className="pt-6">{children}</div>
      </div>
    </LapquestSerialProvider>
  );
}
