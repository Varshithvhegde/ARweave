import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const PLAN_FEATURES = [
  "20 AR experiences",
  "Image marker tracking",
  "QR code generation",
  "10,000 views/month",
  "yourname.arweave.app",
];

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and plan</p>
      </div>

      {/* Profile */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
        <h2 className="font-semibold">Profile</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="first">First name</Label>
            <Input id="first" defaultValue="Varshith" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last">Last name</Label>
            <Input id="last" defaultValue="Hegde" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" defaultValue="varshith@example.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="username">Subdomain</Label>
          <div className="flex">
            <span className="flex items-center px-3 border border-r-0 border-border rounded-l-md bg-muted text-muted-foreground text-sm">
              arweave.app/
            </span>
            <Input id="username" defaultValue="varshith" className="rounded-l-none" />
          </div>
          <p className="text-xs text-muted-foreground">Your public URL: varshith.arweave.app</p>
        </div>
        <Button className="brand-gradient text-white border-0 hover:opacity-90 font-semibold">
          Save changes
        </Button>
      </div>

      <Separator />

      {/* Plan */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Current plan</h2>
          <Badge variant="secondary">Free</Badge>
        </div>
        <ul className="space-y-2">
          {PLAN_FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        <div className="rounded-xl border border-[var(--brand)] bg-[var(--brand-muted)] p-4">
          <p className="text-sm font-semibold mb-1">Upgrade to Pro — ₹499/month</p>
          <p className="text-xs text-muted-foreground mb-3">
            Unlimited experiences, 1,00,000 views/month, custom domain, analytics, no branding.
          </p>
          <Button className="brand-gradient text-white border-0 hover:opacity-90 font-semibold w-full sm:w-auto">
            Upgrade to Pro
          </Button>
        </div>
      </div>

      <Separator />

      {/* Danger zone */}
      <div className="rounded-2xl border border-destructive/30 bg-card p-5 space-y-3">
        <h2 className="font-semibold text-destructive">Danger zone</h2>
        <p className="text-sm text-muted-foreground">
          Permanently delete your account and all experiences. This cannot be undone.
        </p>
        <Button variant="destructive" size="sm">Delete account</Button>
      </div>
    </div>
  );
}
