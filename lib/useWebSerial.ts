"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// --- Web Serial minimal types (for TS configs missing these DOM typings) ---
// These are intentionally minimal: enough for this hook.
declare global {
  interface SerialPort {
    readable: ReadableStream<Uint8Array> | null;
    writable: WritableStream<Uint8Array> | null;
    open(options: { baudRate: number }): Promise<void>;
    close(): Promise<void>;
  }

  interface Serial {
    requestPort(options?: any): Promise<SerialPort>;
  }

  interface Navigator {
    serial?: Serial;
  }
}
// -------------------------------------------------------------------------

export function useWebSerial() {
  const [supported, setSupported] = useState(false);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Not connected");
  const [lastLine, setLastLine] = useState("");

  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const onLineRef = useRef<(line: string) => void>(() => {});

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && "serial" in navigator);
  }, []);

  const setOnLine = useCallback((fn: (line: string) => void) => {
    onLineRef.current = fn;
  }, []);

  const disconnect = useCallback(async () => {
    try {
      try {
        await readerRef.current?.cancel();
      } catch {}
      readerRef.current = null;

      try {
        await portRef.current?.close();
      } catch {}
      portRef.current = null;
    } finally {
      setConnected(false);
      setStatus("Disconnected");
    }
  }, []);

  const connect = useCallback(async () => {
    if (!(typeof navigator !== "undefined" && "serial" in navigator)) {
      setStatus("Web Serial not supported. Use Chrome/Edge.");
      return;
    }

    try {
      setStatus("Select Pico…");
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      portRef.current = port;

      setConnected(true);
      setStatus("Connected");

      const decoder = new TextDecoderStream();
      const closedPromise = port.readable!.pipeTo(decoder.writable);
      const reader = decoder.readable.getReader();
      readerRef.current = reader;

      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += value;
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";

        for (const raw of lines) {
          const line = raw.trim();
          if (!line) continue;
          setLastLine(line);
          onLineRef.current(line);
        }
      }

      await closedPromise;
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? String(e)}`);
      await disconnect();
    }
  }, [disconnect]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { supported, connected, status, lastLine, connect, disconnect, setOnLine };
}

export {};