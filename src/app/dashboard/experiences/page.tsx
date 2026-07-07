import Link from "next/link";
import { Plus, Eye, QrCode, Wand2, MoreHorizontal, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const EXPERIENCES = [
  { id: "1", name: "Wedding AR — Priya & Arjun", views: 487, scans: 201, status: "published", updatedAt: "2 days ago", slug: "priya-arjun-wedding" },
  { id: "2", name: "Product Showcase — Nike Air", views: 612, scans: 244, status: "published", updatedAt: "5 days ago", slug: "nike-air-ar" },
  { id: "3", name: "Event Invite — Startup Demo Day", views: 148, scans: 44, status: "draft", updatedAt: "1 week ago", slug: "startup-demo-day" },
  { id: "4", name: "Business Card — Varshith", views: 0, scans: 0, status: "draft", updatedAt: "2 weeks ago", slug: "varshith-card" },
];

export default function ExperiencesPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Experiences</h1>
          <p className="text-sm text-muted-foreground mt-0.5">4 of 20 used on free plan</p>
        </div>
        <Link href="/dashboard/builder/new">
          <Button className="brand-gradient text-white border-0 hover:opacity-90 gap-2 font-semibold">
            <Plus className="w-4 h-4" /> New experience
          </Button>
        </Link>
      </div>

      {/* Progress bar */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Free plan usage</span>
          <span className="text-sm text-muted-foreground">4 / 20 experiences</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full brand-gradient" style={{ width: "20%" }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Upgrade to Pro for unlimited experiences and 1,00,000 views/month.{" "}
          <Link href="/dashboard/settings" className="text-[var(--brand)] hover:underline">Upgrade</Link>
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {EXPERIENCES.map((exp) => (
          <div key={exp.id} className="rounded-2xl border border-border bg-card overflow-hidden group card-hover">
            {/* Preview area */}
            <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center relative">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                <Wand2 className="w-7 h-7 text-violet-400" />
              </div>
              {exp.status === "published" && (
                <a
                  href={`https://${exp.slug}.arweave.app`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Button size="icon" variant="secondary" className="h-7 w-7 bg-black/50 hover:bg-black/70 border-0">
                    <ExternalLink className="w-3.5 h-3.5 text-white" />
                  </Button>
                </a>
              )}
            </div>

            {/* Info */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-semibold text-sm leading-tight">{exp.name}</p>
                <Badge
                  variant={exp.status === "published" ? "default" : "secondary"}
                  className={`shrink-0 text-xs ${exp.status === "published" ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/20" : ""}`}
                >
                  {exp.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Updated {exp.updatedAt}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {exp.views}</span>
                  <span className="flex items-center gap-1"><QrCode className="w-3.5 h-3.5" /> {exp.scans}</span>
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/builder/${exp.id}`}>
                    <Button size="sm" variant="outline" className="h-7 text-xs px-3">Edit</Button>
                  </Link>
                  <Button size="icon" variant="ghost" className="h-7 w-7">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* New experience card */}
        <Link href="/dashboard/builder/new" className="rounded-2xl border-2 border-dashed border-border hover:border-[var(--brand)] hover:bg-[var(--brand-muted)] transition-colors flex flex-col items-center justify-center py-12 gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-muted group-hover:bg-[var(--brand)] flex items-center justify-center transition-colors">
            <Plus className="w-6 h-6 text-muted-foreground group-hover:text-white transition-colors" />
          </div>
          <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            New experience
          </p>
        </Link>
      </div>
    </div>
  );
}
