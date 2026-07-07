"use client";
import Link from "next/link";
import { useState, useRef } from "react";
import { Layers3, Eye, EyeOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const PERKS = [
  "20 AR experiences free forever",
  "Image marker + QR tracking included",
  "10,000 views/month",
  "No credit card needed",
];

export default function SignupPage() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: emailRef.current!.value,
      password: passwordRef.current!.value,
      options: {
        data: {
          full_name: `${firstRef.current!.value} ${lastRef.current!.value}`.trim(),
          username: usernameRef.current!.value.toLowerCase(),
        },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created! Welcome to ARweave.");
    router.refresh();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background grid-dot-bg px-4 py-12">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left — value prop */}
        <div className="hidden md:flex flex-col gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl brand-gradient flex items-center justify-center shadow">
              <Layers3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">ARweave</span>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-3">
              Build AR experiences<br />
              <span className="brand-gradient-text">in minutes, not months</span>
            </h1>
            <p className="text-muted-foreground">
              The free, open-source alternative to MyWebAR. No ₹3,249/month subscription. No app required.
            </p>
          </div>
          <ul className="space-y-3">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-emerald-500" />
                </div>
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Right — form */}
        <div>
          <Link href="/" className="flex items-center gap-2 mb-8 md:hidden">
            <div className="w-9 h-9 rounded-xl brand-gradient flex items-center justify-center shadow">
              <Layers3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">ARweave</span>
          </Link>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-1">Create your account</h2>
            <p className="text-sm text-muted-foreground mb-6">Free forever · No credit card needed</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="first">First name</Label>
                  <Input ref={firstRef} id="first" placeholder="Varshith" required autoComplete="given-name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="last">Last name</Label>
                  <Input ref={lastRef} id="last" placeholder="Hegde" required autoComplete="family-name" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input ref={emailRef} id="email" type="email" placeholder="you@example.com" required autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <div className="flex">
                  <span className="flex items-center px-3 border border-r-0 border-border rounded-l-md bg-muted text-muted-foreground text-sm">
                    arweave.app/
                  </span>
                  <Input ref={usernameRef} id="username" placeholder="yourname" required className="rounded-l-none" autoComplete="username" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    ref={passwordRef}
                    id="password"
                    type={show ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full brand-gradient text-white border-0 hover:opacity-90 transition-opacity font-semibold"
              >
                {loading ? "Creating account…" : "Create free account"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                By signing up you agree to our{" "}
                <Link href="/terms" className="underline hover:text-foreground">Terms</Link> and{" "}
                <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
              </p>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--brand)] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
