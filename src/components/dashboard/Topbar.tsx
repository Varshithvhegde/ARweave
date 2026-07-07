"use client";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function DashboardTopbar() {
  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 md:px-6 gap-4 shrink-0">
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search experiences…" className="pl-9 h-9 bg-muted border-0 text-sm" />
        </div>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Notifications">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--brand)]" />
        </Button>
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarFallback className="brand-gradient text-white text-xs font-bold">VH</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
