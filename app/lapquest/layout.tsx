import type { ReactNode } from "react";
import { LapquestSerialProvider } from "@/components/lapquest/serial-provider";

export default function LapquestLayout({ children }: { children: ReactNode }) {
  return <LapquestSerialProvider>{children}</LapquestSerialProvider>;
}
