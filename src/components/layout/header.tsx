import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { createClient } from "@/lib/supabase/server";
import { HeaderAuth } from "./header-auth";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-xl font-bold tracking-tight hover:opacity-80 transition-opacity"
        >
          My Journal
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <HeaderAuth user={user} />
        </div>
      </div>
    </header>
  );
}
