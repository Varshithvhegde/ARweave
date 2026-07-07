import { TrendingUp, Eye, QrCode, Clock, Users } from "lucide-react";

const STATS = [
  { label: "Total views", value: "1,247", delta: "+18%", icon: Eye },
  { label: "QR scans", value: "489", delta: "+32%", icon: QrCode },
  { label: "Avg. session", value: "38s", delta: "+5s", icon: Clock },
  { label: "Unique visitors", value: "844", delta: "+21%", icon: Users },
];

const TOP_EXPERIENCES = [
  { name: "Product Showcase — Nike Air", views: 612, scans: 244, conversion: "39.9%" },
  { name: "Wedding AR — Priya & Arjun", views: 487, scans: 201, conversion: "41.3%" },
  { name: "Event Invite — Startup Demo Day", views: 148, scans: 44, conversion: "29.7%" },
];

// Simple bar chart data (relative widths)
const WEEK_DATA = [
  { day: "Mon", views: 120, scans: 48 },
  { day: "Tue", views: 180, scans: 72 },
  { day: "Wed", views: 240, scans: 96 },
  { day: "Thu", views: 160, scans: 64 },
  { day: "Fri", views: 320, scans: 128 },
  { day: "Sat", views: 280, scans: 112 },
  { day: "Sun", views: 147, scans: 59 },
];

const MAX_VIEWS = Math.max(...WEEK_DATA.map((d) => d.views));

export default function AnalyticsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Last 30 days</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <s.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold tracking-tight">{s.value}</p>
            <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {s.delta} this month
            </p>
          </div>
        ))}
      </div>

      {/* Views chart */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold">Views this week</h2>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm brand-gradient inline-block" /> Views
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40 inline-block" /> Scans
            </span>
          </div>
        </div>
        <div className="flex items-end justify-between gap-2 h-32">
          {WEEK_DATA.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col items-center gap-0.5 flex-1 justify-end">
                <div
                  className="w-full brand-gradient rounded-t-md opacity-80"
                  style={{ height: `${(d.views / MAX_VIEWS) * 100}%` }}
                />
                <div
                  className="w-full bg-emerald-500/50 rounded-t-md"
                  style={{ height: `${(d.scans / MAX_VIEWS) * 100}%`, marginTop: "2px" }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top experiences */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Top experiences</h2>
        </div>
        <div className="divide-y divide-border">
          <div className="grid grid-cols-4 px-5 py-2 text-xs text-muted-foreground font-medium">
            <span className="col-span-2">Experience</span>
            <span className="text-right">Views</span>
            <span className="text-right">Scan rate</span>
          </div>
          {TOP_EXPERIENCES.map((exp, i) => (
            <div key={exp.name} className="grid grid-cols-4 px-5 py-3.5 items-center hover:bg-muted/40 transition-colors">
              <div className="col-span-2 flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                <span className="text-sm font-medium truncate">{exp.name}</span>
              </div>
              <span className="text-sm text-right">{exp.views.toLocaleString()}</span>
              <span className="text-sm text-right text-emerald-500 font-medium">{exp.conversion}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
