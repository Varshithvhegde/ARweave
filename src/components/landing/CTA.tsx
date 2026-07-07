"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CTA() {
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-border bg-card p-10 md:p-16 relative overflow-hidden glow-brand"
        >
          {/* Background glow */}
          <div className="absolute inset-0 brand-gradient opacity-5 pointer-events-none" />

          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 relative">
            Ready to make AR?
          </h2>
          <p className="text-muted-foreground mb-8 text-base md:text-lg relative max-w-lg mx-auto">
            Join thousands of creators, wedding planners, marketers and businesses building AR experiences that wow.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center relative">
            <Link href="/signup">
              <Button size="lg" className="brand-gradient text-white border-0 h-12 px-8 gap-2 hover:opacity-90 transition-opacity font-semibold">
                Start building free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/examples">
              <Button size="lg" variant="outline" className="h-12 px-8">
                See live examples
              </Button>
            </Link>
          </div>
          <p className="mt-5 text-xs text-muted-foreground relative">
            Free forever · No credit card · 20 projects included
          </p>
        </motion.div>
      </div>
    </section>
  );
}
