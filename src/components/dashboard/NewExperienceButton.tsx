"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function NewExperienceButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const res = await fetch("/api/experience/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id ?? null }),
      });

      if (!res.ok) throw new Error("Failed to create");
      const { slug } = await res.json();
      router.push(`/dashboard/builder/${slug}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create experience");
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCreate}
      disabled={loading}
      className={`brand-gradient text-white border-0 hover:opacity-90 gap-2 font-semibold ${className ?? ""}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
      {loading ? "Creating…" : "New experience"}
    </Button>
  );
}
