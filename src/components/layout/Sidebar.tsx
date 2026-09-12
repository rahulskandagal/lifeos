"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, ChevronsLeft, ChevronsRight } from "lucide-react";
import { NAV_ITEMS, SECONDARY_NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils/cn";
import { useUIStore } from "@/lib/store/uiStore";

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col shrink-0 border-r border-border bg-surface h-screen sticky top-0 transition-all duration-200",
        collapsed ? "w-[76px]" : "w-64"
      )}
    >
      <div className={cn("flex items-center gap-2 px-4 h-16 shrink-0", collapsed && "justify-center px-0")}>
        <div className="h-8 w-8 rounded-lg gradient-accent flex items-center justify-center text-white shrink-0">
          <Sparkles className="h-4.5 w-4.5" />
        </div>
        {!collapsed && <span className="font-bold tracking-tight text-[15px]">LifeOS</span>}
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 space-y-0.5 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors group relative focus-ring",
                active ? "bg-accent/12 text-accent" : "text-muted hover:text-foreground hover:bg-surface-2",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-accent" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-2.5 pb-2 space-y-0.5 border-t border-border pt-2">
        {SECONDARY_NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-ring",
                active ? "bg-accent/12 text-accent" : "text-muted hover:text-foreground hover:bg-surface-2",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:text-foreground hover:bg-surface-2 transition-colors focus-ring"
        >
          {collapsed ? <ChevronsRight className="h-[18px] w-[18px]" /> : <ChevronsLeft className="h-[18px] w-[18px]" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
