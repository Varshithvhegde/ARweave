"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers3, LayoutDashboard, Wand2, BarChart2, Settings, HelpCircle, LogOut, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/experiences", icon: Wand2, label: "Experiences" },
  { href: "/dashboard/analytics", icon: BarChart2, label: "Analytics" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

const BOTTOM_NAV = [
  { href: "/help", icon: HelpCircle, label: "Help & docs" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md brand-gradient flex items-center justify-center">
            <Layers3 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base">ARweave</span>
        </Link>
      </div>

      {/* New experience CTA */}
      <div className="px-3 py-4">
        <Link href="/dashboard/builder/new">
          <Button size="sm" className="w-full brand-gradient text-white border-0 hover:opacity-90 gap-2 font-semibold">
            <Plus className="w-4 h-4" /> New experience
          </Button>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map((item) => {
          const active = item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--brand-muted)] text-[var(--brand)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-border pt-4">
        {BOTTOM_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium"
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors font-medium">
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
