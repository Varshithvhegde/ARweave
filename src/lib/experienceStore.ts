// File-based persistence — survives hot reloads in dev
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";

export type ExperienceConfig = {
  slug: string;
  name: string;
  modelUrl: string;
  markerUrl: string | null;
  scale: number;
  animation: string;
  createdAt: string;
};

const STORE_DIR  = path.join(process.cwd(), ".next", "cache");
const STORE_FILE = path.join(STORE_DIR, "arweave-experiences.json");

function readStore(): Record<string, ExperienceConfig> {
  try {
    mkdirSync(STORE_DIR, { recursive: true });
    return JSON.parse(readFileSync(STORE_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeStore(data: Record<string, ExperienceConfig>) {
  try {
    mkdirSync(STORE_DIR, { recursive: true });
    writeFileSync(STORE_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Failed to write experience store:", e);
  }
}

export function saveExperience(config: ExperienceConfig) {
  const store = readStore();
  store[config.slug] = config;
  writeStore(store);
}

export function getExperience(slug: string): ExperienceConfig | null {
  const store = readStore();
  return store[slug] ?? null;
}
