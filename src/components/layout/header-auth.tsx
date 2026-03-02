"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { PenLine, LogOut } from "lucide-react";

export function HeaderAuth({ user }: { user: User | null }) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (user) {
    return (
      <div className="flex items-center gap-1">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href="/write">
            <PenLine size={16} />
            <span className="hidden sm:inline">글쓰기</span>
          </Link>
        </Button>
        <Button variant="ghost" size="icon" className="w-9 h-9" onClick={handleLogout}>
          <LogOut size={16} />
        </Button>
      </div>
    );
  }

  return (
    <Button asChild variant="ghost" size="sm">
      <Link href="/login">로그인</Link>
    </Button>
  );
}
