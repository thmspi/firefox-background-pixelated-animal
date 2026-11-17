import { ANIMALS, ANIMAL_KEYS, SHARED_CONTROLS, type AnimalKey, type KnobSpec } from "../src";

export const STORAGE_KEY = "settings";

export const GLASS_DEFAULTS = {
  blur: 3.5,
  tint: 0,
  edge: 0.55,
  radius: 24,
  width: 720,
};

export type GlassKey = keyof typeof GLASS_DEFAULTS;
export type AnimalMode = "single" | "random";

export const GLASS_CONTROLS: { key: GlassKey; label: string; min: number; max: number; step: number; hint: string }[] = [
  { key: "blur", label: "Blur", min: 0, max: 30, step: 0.5, hint: "How much the search box blurs the animals behind it." },
  { key: "tint", label: "Tint", min: 0, max: 3, step: 0.05, hint: "How milky the glass appears." },
  { key: "edge", label: "Edge", min: 0, max: 2, step: 0.05, hint: "Strength of the glass border and highlight." },
  { key: "radius", label: "Corner radius", min: 0, max: 48, step: 1, hint: "Roundness of the search box corners." },
  { key: "width", label: "Width", min: 320, max: 960, step: 10, hint: "Maximum search box width in pixels." },
];

export interface Settings {
  mode: AnimalMode;
  animal: AnimalKey;
  randomAnimals: AnimalKey[];
  name: string;
  tuning: Partial<Record<AnimalKey, Record<string, number | boolean>>>;
  glass: Partial<Record<AnimalKey, Partial<Record<GlassKey, number>>>>;
}

export const DEFAULT_SETTINGS: Settings = {
  mode: "single", animal: "butterflies", randomAnimals: [...ANIMAL_KEYS], name: "", tuning: {}, glass: {},
};

const object = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

export function controlsFor(animal: AnimalKey): [string, KnobSpec[]][] {
  const definition = ANIMALS[animal];
  const hidden = new Set<string>(definition.hide ?? []);
  const visible = (controls: KnobSpec[]) => controls.filter((control) => !hidden.has(control.key));
  return [
    ["Movement", visible(SHARED_CONTROLS.movement)],
    ...definition.controls,
    ["Look", visible(SHARED_CONTROLS.look)],
  ];
}

export function normalizeSettings(value: unknown): Settings {
  const raw = object(value);
  const mode: AnimalMode = raw.mode === "random" ? "random" : "single";
  const animal = typeof raw.animal === "string" && ANIMAL_KEYS.includes(raw.animal as AnimalKey)
    ? raw.animal as AnimalKey : DEFAULT_SETTINGS.animal;
  const requested = Array.isArray(raw.randomAnimals) ? raw.randomAnimals : ANIMAL_KEYS;
  const randomAnimals = ANIMAL_KEYS.filter((key) => requested.includes(key));
  if (randomAnimals.length === 0) randomAnimals.push(animal);
  const name = typeof raw.name === "string" ? raw.name.slice(0, 40) : "";
  const tuning: Settings["tuning"] = {};
  const rawTuning = object(raw.tuning);
  for (const key of ANIMAL_KEYS) {
    const entry = object(rawTuning[key]);
    const valid: Record<string, number | boolean> = {};
    for (const [, controls] of controlsFor(key)) {
      for (const control of controls) {
        const candidate = entry[control.key];
        if ("toggle" in control) {
          if (typeof candidate === "boolean") valid[control.key] = candidate;
        } else if (typeof candidate === "number" && Number.isFinite(candidate)
          && candidate >= control.min && candidate <= control.max) {
          valid[control.key] = candidate;
        }
      }
    }
    if (Object.keys(valid).length) tuning[key] = valid;
  }
  const glass: Settings["glass"] = {};
  const rawGlass = object(raw.glass);
  // Earlier versions stored one shared glass object. Carry those values to each animal once.
  for (const key of ANIMAL_KEYS) {
    const entry = object(rawGlass[key]);
    const valid: Partial<Record<GlassKey, number>> = {};
    for (const control of GLASS_CONTROLS) {
      const candidate = entry[control.key] ?? rawGlass[control.key];
      if (typeof candidate === "number" && Number.isFinite(candidate)
        && candidate >= control.min && candidate <= control.max) valid[control.key] = candidate;
    }
    if (Object.keys(valid).length) glass[key] = valid;
  }
  return { mode, animal, randomAnimals, name, tuning, glass };
}

/** Keep an open random tab's animal while it remains in the pool; choose on each new tab. */
export function animalForTab(
  settings: Settings,
  previousAnimal?: AnimalKey,
  previousMode?: AnimalMode,
  random = Math.random,
): AnimalKey {
  if (settings.mode === "single") return settings.animal;
  if (previousMode === "random" && previousAnimal && settings.randomAnimals.includes(previousAnimal)) return previousAnimal;
  const index = Math.floor(random() * settings.randomAnimals.length);
  return settings.randomAnimals[index] ?? settings.randomAnimals[0] ?? settings.animal;
}

export async function loadSettings(): Promise<Settings> {
  return normalizeSettings((await browser.storage.local.get(STORAGE_KEY))[STORAGE_KEY]);
}

export function applyGlass(glass: Partial<Record<GlassKey, number>> | undefined) {
  const values = { ...GLASS_DEFAULTS, ...glass };
  const composer = document.querySelector<HTMLElement>(".composer");
  if (!composer) return;
  const stage = document.querySelector<HTMLElement>(".stage")!;
  composer.style.setProperty("--blur", `${values.blur}px`);
  composer.style.borderRadius = `${values.radius}px`;
  stage.style.width = `min(${values.width}px, calc(100vw - 32px))`;
  document.documentElement.style.setProperty("--tint", String(values.tint));
  document.documentElement.style.setProperty("--edge", String(values.edge));
}
