"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Calendar, CheckCircle2, Bookmark } from "lucide-react";

const tabs = [
  { href: "/", label: "홈", icon: BookOpen },
  { href: "/calendar", label: "달력", icon: Calendar },
  { href: "/habits", label: "습관", icon: CheckCircle2 },
  { href: "/bookmarks", label: "북마크", icon: Bookmark },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 sm:hidden safe-bottom">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/" || pathname.startsWith("/posts")
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
