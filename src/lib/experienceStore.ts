// In-memory store for local dev — survives the server process lifetime
// In production this would be Supabase

export type ExperienceConfig = {
  slug: string;
  name: string;
  modelUrl: string;       // absolute URL accessible from any device
  markerUrl: string | null; // absolute URL or null
  scale: number;
  animation: string;
  createdAt: string;
};

const store = new Map<string, ExperienceConfig>();

export function saveExperience(config: ExperienceConfig) {
  store.set(config.slug, config);
}

export function getExperience(slug: string): ExperienceConfig | null {
  return store.get(slug) ?? null;
}
