"use client";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const PLANS = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Perfect for personal projects and experimenting.",
    features: [
      "20 AR experiences",
      "Image marker tracking",
      "QR code generation",
      "10,000 views/month",
      "yourname.arweave.app subdomain",
      "Community support",
    ],
    cta: "Get started free",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Pro",
    price: "₹499",
    period: "per month",
    description: "For creators, freelancers, and small businesses.",
    features: [
      "Unlimited AR experiences",
      "Image + QR marker tracking",
      "1,00,000 views/month",
      "Custom domain support",
      "Password-protected experiences",
      "Analytics dashboard",
      "Priority email support",
      "Remove ARweave branding",
    ],
    cta: "Start Pro",
    href: "/signup?plan=pro",
    highlight: true,
  },
  {
    name: "Business",
    price: "₹1,999",
    period: "per month",
    description: "For agencies, enterprises, and white-label needs.",
    features: [
      "Everything in Pro",
      "White-label branding",
      "Multiple team members",
      "Unlimited views",
      "API access",
      "Webhook integrations",
      "Dedicated support",
      "SLA guarantee",
    ],
    cta: "Contact us",
    href: "/contact",
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-sm font-semibold uppercase tracking-widest text-[var(--brand)] mb-3"
          >
            Pricing
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
          >
            Simple, honest pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground max-w-lg mx-auto"
          >
            MyWebAR charges ₹3,249/month for image tracking. We give it to you free.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-2xl border p-6 flex flex-col gap-6 ${
                plan.highlight
                  ? "border-[var(--brand)] bg-card glow-brand scale-105"
                  : "border-border bg-card"
              }`}
            >
              {plan.highlight && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 brand-gradient text-white border-0">
                  Most popular
                </Badge>
              )}

              <div>
                <p className="font-semibold text-sm text-muted-foreground mb-1">{plan.name}</p>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                  <span className="text-muted-foreground text-sm mb-1">/{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.href}>
                <Button
                  className={`w-full ${plan.highlight ? "brand-gradient text-white border-0 hover:opacity-90" : ""}`}
                  variant={plan.highlight ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
