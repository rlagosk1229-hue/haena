import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { createClient } from "@/lib/supabase/server";
import { HeaderAuth } from "./header-auth";
import { LogoIcon } from "@/components/icons/logo-icon";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 glass shadow-sm">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 group hover:opacity-90 transition-opacity"
        >
          <div className="bg-primary/10 p-1.5 rounded-full">
            <LogoIcon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
          </div>
          <span className="font-serif text-xl font-bold tracking-tight">해나</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <HeaderAuth user={user} />
        </div>
      </div>
    </header>
  );
}
