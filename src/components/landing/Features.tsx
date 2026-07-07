"use client";
import { motion } from "framer-motion";
import {
  Scan, Upload, QrCode, Smartphone, Zap, Globe, Palette, Lock
} from "lucide-react";

const FEATURES = [
  {
    icon: Upload,
    title: "Drag-drop 3D builder",
    description: "Upload any GLB/GLTF model, place it on your marker, and adjust scale, position, and animation in a live 3D viewport.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: Scan,
    title: "Image marker tracking",
    description: "Use any high-contrast image — your wedding photo, product packaging, business card, or a poster — as the AR trigger.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: QrCode,
    title: "QR code generation",
    description: "Every experience gets a scannable QR code automatically. Print it on invitations, menus, or anywhere you need AR magic.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Smartphone,
    title: "No app needed",
    description: "AR runs directly in the mobile browser. Guests scan the QR, allow camera access, and the experience appears — instantly.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    icon: Zap,
    title: "Publish in one click",
    description: "Hit publish and get a shareable link and QR in seconds. Your unique subdomain: yourname.arweave.app.",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  {
    icon: Globe,
    title: "Custom subdomains",
    description: "Every account gets a personal subdomain. Share branded links instead of random URLs — perfect for clients and events.",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    icon: Palette,
    title: "Model library",
    description: "Pick from hundreds of free 3D models for common use cases — weddings, products, celebrations, architecture, and more.",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
  {
    icon: Lock,
    title: "Private experiences",
    description: "Password-protect any AR experience. Perfect for corporate demos, private events, or paid content.",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-sm font-semibold uppercase tracking-widest text-[var(--brand)] mb-3"
          >
            Everything you need
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4"
          >
            AR made simple,<br />for everyone
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground max-w-xl mx-auto text-base md:text-lg"
          >
            No 3D skills required. No coding. No expensive subscriptions. Just upload, place, and share.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group rounded-2xl border border-border bg-card p-5 card-hover cursor-default"
            >
              <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="font-semibold text-sm mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
