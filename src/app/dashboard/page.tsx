import Link from "next/link";
import { Plus, Eye, QrCode, Wand2, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATS = [
  { label: "Total experiences", value: "3", change: "+1 this week", icon: Wand2, color: "text-violet-500", bg: "bg-violet-500/10" },
  { label: "Total views", value: "1,247", change: "+18% vs last month", icon: Eye, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "QR scans", value: "489", change: "+32% vs last month", icon: QrCode, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { label: "Avg. engagement", value: "38s", change: "+5s vs last month", icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-500/10" },
];

const EXPERIENCES = [
  { id: "1", name: "Wedding AR — Priya & Arjun", views: 487, scans: 201, status: "published", updatedAt: "2 days ago" },
  { id: "2", name: "Product Showcase — Nike Air", views: 612, scans: 244, status: "published", updatedAt: "5 days ago" },
  { id: "3", name: "Event Invite — Startup Demo Day", views: 148, scans: 44, status: "draft", updatedAt: "1 week ago" },
];

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Welcome back, Varshith</p>
        </div>
        <Link href="/dashboard/builder/new">
          <Button className="brand-gradient text-white border-0 hover:opacity-90 gap-2 font-semibold">
            <Plus className="w-4 h-4" /> New experience
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.change}</p>
          </div>
        ))}
      </div>

      {/* Recent experiences */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent experiences</h2>
          <Link href="/dashboard/experiences" className="text-sm text-[var(--brand)] hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="divide-y divide-border">
            {EXPERIENCES.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl brand-gradient flex items-center justify-center shrink-0">
                    <Wand2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{exp.name}</p>
                    <p className="text-xs text-muted-foreground">Updated {exp.updatedAt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0 ml-4">
                  <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {exp.views}</span>
                    <span className="flex items-center gap-1.5"><QrCode className="w-3.5 h-3.5" /> {exp.scans}</span>
                  </div>
                  <Badge variant={exp.status === "published" ? "default" : "secondary"} className={exp.status === "published" ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20" : ""}>
                    {exp.status}
                  </Badge>
                  <Link href={`/dashboard/builder/${exp.id}`}>
                    <Button size="sm" variant="outline">Edit</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Empty state prompt if no experiences */}
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <div className="w-12 h-12 rounded-2xl brand-gradient mx-auto flex items-center justify-center mb-4">
          <Wand2 className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-semibold mb-1">Build your first AR experience</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
          Upload a 3D model, set your marker image, and share a scannable link in under 5 minutes.
        </p>
        <Link href="/dashboard/builder/new">
          <Button className="brand-gradient text-white border-0 hover:opacity-90 gap-2">
            <Plus className="w-4 h-4" /> Create experience
          </Button>
        </Link>
      </div>
    </div>
  );
}
