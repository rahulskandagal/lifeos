"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils/cn";

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-1 w-full h-full focus-ring">
              <item.icon className={cn("h-5 w-5", active ? "text-accent" : "text-muted")} />
              <span className={cn("text-[10px] font-medium", active ? "text-accent" : "text-muted")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
