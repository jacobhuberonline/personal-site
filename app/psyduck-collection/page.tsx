import type { Metadata } from "next";

import { PsyduckCollection } from "@/components/psyduck-collection";

export const metadata: Metadata = {
  title: "Psyduck Collection",
  description:
    "A static tracker for Psyduck card purchases, wish list targets, binder planning, and TCGplayer search links.",
};

export default function PsyduckCollectionPage() {
  return <PsyduckCollection />;
}
