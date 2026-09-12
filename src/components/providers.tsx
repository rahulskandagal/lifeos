"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster, toast } from "sonner";
import { useEffect } from "react";
import { initOfflineSync } from "@/lib/offlineQueue";
import { mutate } from "swr";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    initOfflineSync((count) => {
      toast.success(`Synced ${count} offline change${count > 1 ? "s" : ""}`);
      mutate(() => true);
    });
  }, []);

  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
        <Toaster position="bottom-right" richColors closeButton theme="system" />
      </ThemeProvider>
    </SessionProvider>
  );
}
