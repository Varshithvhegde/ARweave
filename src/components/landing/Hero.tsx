"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background grid + glow */}
      <div className="absolute inset-0 grid-dot-bg" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[var(--brand)] opacity-5 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-purple-500 opacity-5 blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs font-medium border border-border">
            <Sparkles className="w-3 h-3 text-[var(--brand)]" />
            No app needed — pure browser WebAR
          </Badge>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6"
        >
          Create AR experiences
          <br />
          <span className="brand-gradient-text">anyone can scan</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Upload a 3D model, set a marker image or QR code, and publish.
          Your AR experience runs in the mobile browser — no app install, no code, no monthly bill.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link href="/signup">
            <Button size="lg" className="brand-gradient text-white border-0 h-12 px-8 text-base font-semibold shadow-md hover:opacity-90 transition-opacity gap-2">
              Start for free <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="h-12 px-8 text-base gap-2">
            <Play className="w-4 h-4" /> Watch demo
          </Button>
        </motion.div>

        {/* Social proof */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-6 text-sm text-muted-foreground"
        >
          Free forever · 20 projects · No credit card needed
        </motion.p>

        {/* Hero visual */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 relative mx-auto max-w-3xl"
        >
          <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden glow-brand">
            {/* Mock browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/60 border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-3 h-6 rounded-md bg-background/80 border border-border flex items-center px-3">
                <span className="text-xs text-muted-foreground font-mono">arweave.app/builder</span>
              </div>
            </div>

            {/* Mock builder UI */}
            <div className="aspect-[16/9] bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center relative">
              {/* Simulated 3D scene */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-violet-500/30 to-purple-500/20 border border-violet-500/30 flex items-center justify-center animate-pulse">
                  <span className="text-4xl select-none">🧊</span>
                </div>
              </div>
              {/* Toolbar overlay */}
              <div className="absolute top-3 left-3 flex gap-2">
                {["Move", "Scale", "Rotate"].map((t) => (
                  <div key={t} className={`px-2 py-1 rounded text-xs font-medium ${t === "Move" ? "bg-[var(--brand)] text-white" : "bg-black/40 text-white/60"}`}>
                    {t}
                  </div>
                ))}
              </div>
              {/* Side panel */}
              <div className="absolute right-3 top-3 bottom-3 w-36 bg-black/50 rounded-lg border border-white/10 p-3 flex flex-col gap-2">
                <div className="text-xs text-white/50 font-medium uppercase tracking-wide">Properties</div>
                {[["Scale", "1.0x"], ["Rot Y", "45°"], ["Anim", "Spin"]].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center">
                    <span className="text-xs text-white/50">{k}</span>
                    <span className="text-xs text-white font-mono">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
