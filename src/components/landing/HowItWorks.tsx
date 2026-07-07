"use client";
import { motion } from "framer-motion";
import { Upload, MousePointerClick, Share2, ScanLine } from "lucide-react";

const STEPS = [
  {
    step: "01",
    icon: Upload,
    title: "Upload your 3D model",
    description: "Drop a GLB file or pick from our free library. Supports animations, textures, and PBR materials.",
  },
  {
    step: "02",
    icon: MousePointerClick,
    title: "Set your marker image",
    description: "Upload any image to use as the AR trigger — wedding invite, product photo, business card, or menu.",
  },
  {
    step: "03",
    icon: Share2,
    title: "Publish & get your QR",
    description: "Hit publish. Get a QR code and shareable link in one click. Print the QR wherever you need it.",
  },
  {
    step: "04",
    icon: ScanLine,
    title: "Anyone scans & sees AR",
    description: "Visitors scan the QR, allow camera, and point at the marker. Your 3D experience appears on top. No app needed.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-muted/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-sm font-semibold uppercase tracking-widest text-[var(--brand)] mb-3"
          >
            How it works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold tracking-tight"
          >
            From idea to AR in 4 steps
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connector line on desktop */}
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-2xl border border-border bg-card flex items-center justify-center shadow-sm">
                  <s.icon className="w-8 h-8 text-[var(--brand)]" />
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full brand-gradient flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{i + 1}</span>
                </div>
              </div>
              <h3 className="font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
