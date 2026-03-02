"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-14 h-7 rounded-full bg-secondary" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`
        relative w-14 h-7 rounded-full transition-colors duration-300
        ${isDark ? "bg-slate-700" : "bg-blue-200"}
      `}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
    >
      {/* Sliding circle */}
      <span
        className={`
          absolute top-0.5 left-0.5
          w-6 h-6 rounded-full
          flex items-center justify-center
          transition-all duration-300 ease-in-out
          ${isDark ? "translate-x-7 bg-slate-900" : "translate-x-0 bg-white"}
          shadow-sm
        `}
      >
        {isDark ? (
          <Moon size={14} className="text-blue-300" />
        ) : (
          <Sun size={14} className="text-amber-500" />
        )}
      </span>
    </button>
  );
}
