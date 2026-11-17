import { ANIMALS, AnimalEngine, type AnimalKey } from "../src";
import { animalForTab, applyGlass, DEFAULT_SETTINGS, loadSettings, normalizeSettings, STORAGE_KEY, type Settings } from "./settings";

const canvas = document.querySelector<HTMLCanvasElement>("canvas")!;
const greeting = document.querySelector<HTMLElement>(".greeting")!;
const form = document.querySelector<HTMLFormElement>(".composer")!;
const query = form.querySelector<HTMLInputElement>("input[name=query]")!;
const error = document.querySelector<HTMLElement>(".search-error")!;
const shortcuts = document.querySelector<HTMLElement>(".shortcuts")!;
const shortcutGrid = shortcuts.querySelector<HTMLElement>(".shortcut-grid")!;

let settings: Settings;
let animal: AnimalKey;
let engine: AnimalEngine;

async function loadShortcuts() {
  try {
    // This is Firefox's own New Tab list, including sites pinned by the user.
    const sites = await browser.topSites.get({ newtab: true, includeFavicon: true, limit: 32 });
    for (const site of sites) {
      let url: URL;
      try { url = new URL(site.url); } catch { continue; }
      if (url.protocol !== "http:" && url.protocol !== "https:") continue;
      const link = document.createElement("a");
      link.className = "shortcut";
      link.href = url.href;
      link.title = site.title || url.hostname;
      const icon = document.createElement("span");
      icon.className = "shortcut-icon";
      if (site.favicon?.startsWith("data:image/")) {
        const image = document.createElement("img");
        image.src = site.favicon;
        image.alt = "";
        icon.append(image);
      } else {
        icon.textContent = url.hostname.replace(/^www\./, "").charAt(0).toUpperCase();
      }
      const label = document.createElement("span");
      label.className = "shortcut-label";
      label.textContent = site.title || url.hostname.replace(/^www\./, "");
      link.append(icon, label);
      shortcutGrid.append(link);
    }
    shortcuts.hidden = shortcutGrid.childElementCount === 0;
  } catch {
    shortcuts.hidden = true;
  }
}

function updateGreeting() {
  const hour = new Date().getHours();
  const phrase = hour >= 5 && hour < 12 ? "Good morning" : hour >= 12 && hour < 17
    ? "Good afternoon" : hour >= 17 && hour < 22 ? "Good evening" : "Still up";
  greeting.textContent = `${phrase}${settings.name.trim() ? `, ${settings.name.trim()}` : ""}${phrase === "Still up" ? "?" : ""}`;
}

function applySettings(next: Settings) {
  const nextAnimal = animalForTab(next, animal, settings.mode);
  settings = next;
  if (animal !== nextAnimal) {
    animal = nextAnimal;
    engine.setAnimal(animal, next.tuning[animal]);
  } else {
    const values = { ...ANIMALS[animal].defaults, ...next.tuning[animal] };
    for (const [key, value] of Object.entries(values)) {
      if (engine.tuning[key] !== value) engine.set(key, value);
    }
  }
  applyGlass(settings.glass[animal]);
  updateGreeting();
}

async function start() {
  settings = await loadSettings();
  animal = animalForTab(settings);
  engine = new AnimalEngine(canvas, { animal, theme: "dark", tuning: settings.tuning[animal] });
  applyGlass(settings.glass[animal]);
  updateGreeting();
  setInterval(updateGreeting, 60_000);
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[STORAGE_KEY]) applySettings(normalizeSettings(changes[STORAGE_KEY].newValue));
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = query.value.trim();
  if (!text) return;
  error.hidden = true;
  try {
    await browser.search.search({ query: text, disposition: "CURRENT_TAB" });
  } catch {
    error.textContent = "Search could not start. Please try again.";
    error.hidden = false;
  }
});

if (matchMedia("(hover: hover) and (pointer: fine)").matches) query.focus({ preventScroll: true });
void loadShortcuts();
start().catch(() => {
  settings = structuredClone(DEFAULT_SETTINGS);
  animal = animalForTab(settings);
  engine = new AnimalEngine(canvas, { animal, theme: "dark" });
  updateGreeting();
});
