import type { ReactNode } from "react";
import { LapquestSerialProvider } from "@/components/lapquest/serial-provider";
import { LapquestNav } from "@/components/lapquest/nav";

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
