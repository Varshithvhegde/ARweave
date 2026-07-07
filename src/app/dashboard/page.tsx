import { Eye, QrCode, Wand2, TrendingUp, ArrowRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import NewExperienceButton from "@/components/dashboard/NewExperienceButton";
import { createClient } from "@/lib/supabase/server";

const STATS = [
  { label: "Total experiences", value: "—", icon: Wand2,     color: "text-violet-500", bg: "bg-violet-500/10" },
  { label: "Total views",       value: "—", icon: Eye,        color: "text-blue-500",   bg: "bg-blue-500/10" },
  { label: "QR scans",          value: "—", icon: QrCode,     color: "text-emerald-500",bg: "bg-emerald-500/10" },
  { label: "Avg. engagement",   value: "—", icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-500/10" },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch real experiences from DB
  const { data: experiences } = user
    ? await supabase
        .from("experiences")
        .select("id, slug, name, status, total_views, total_scans, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(5)
    : { data: [] };

  const list = experiences ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
          </p>
        </div>
        <NewExperienceButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">
              {i === 0 ? list.length : "—"}
            </p>
          </div>
        ))}
      </div>

      {/* Experiences */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Your experiences</h2>
          <Link href="/dashboard/experiences" className="text-sm text-[var(--brand)] hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl brand-gradient mx-auto flex items-center justify-center">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold">No experiences yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Create your first AR experience — upload a 3D model, set a marker, and get a shareable QR code.
            </p>
            <NewExperienceButton className="mt-2" />
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="divide-y divide-border">
              {list.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl brand-gradient flex items-center justify-center shrink-0">
                      <Wand2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{exp.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        /ar/{exp.slug}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 ml-4">
                    <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {exp.total_views ?? 0}</span>
                      <span className="flex items-center gap-1"><QrCode className="w-3.5 h-3.5" /> {exp.total_scans ?? 0}</span>
                    </div>
                    <Badge
                      variant={exp.status === "published" ? "default" : "secondary"}
                      className={exp.status === "published" ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/20" : ""}
                    >
                      {exp.status}
                    </Badge>
                    <a href={`/ar/${exp.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="Open AR viewer">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                    <Link href={`/dashboard/builder/${exp.slug}`}>
                      <Button size="sm" variant="outline">Edit</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
