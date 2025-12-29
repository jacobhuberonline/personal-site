"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useWebSerial } from "@/lib/useWebSerial";

type SerialContextValue = ReturnType<typeof useWebSerial>;

const SerialContext = createContext<SerialContextValue | null>(null);

export function LapquestSerialProvider({ children }: { children: ReactNode }) {
  const serial = useWebSerial();
  return <SerialContext.Provider value={serial}>{children}</SerialContext.Provider>;
}

export function useLapquestSerial() {
  const ctx = useContext(SerialContext);
  if (!ctx) {
    throw new Error("useLapquestSerial must be used within LapquestSerialProvider");
  }
  return ctx;
}
