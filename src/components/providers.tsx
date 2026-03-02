"use client";

import { ThemeProvider } from "next-themes";
import { PWARegister } from "./pwa-register";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <PWARegister />
    </ThemeProvider>
  );
}
