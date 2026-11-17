import { ANIMALS, ANIMAL_KEYS, type AnimalKey, type KnobSpec } from "../src";
import { controlsFor, DEFAULT_SETTINGS, GLASS_CONTROLS, GLASS_DEFAULTS, loadSettings, STORAGE_KEY, type Settings } from "./settings";

const animalSelect = document.querySelector<HTMLSelectElement>("#animal")!;
const modeSelect = document.querySelector<HTMLSelectElement>("#mode")!;
const randomPool = document.querySelector<HTMLFieldSetElement>("#random-pool")!;
const randomAnimalsHost = document.querySelector<HTMLElement>("#random-animals")!;
const animalLabel = document.querySelector<HTMLElement>("#animal-label")!;
const animalHelp = document.querySelector<HTMLElement>("#animal-help")!;
const nameInput = document.querySelector<HTMLInputElement>("#name")!;
const controlsHost = document.querySelector<HTMLElement>("#controls")!;
const status = document.querySelector<HTMLElement>("#status")!;
let settings: Settings = structuredClone(DEFAULT_SETTINGS);
let saveQueue = Promise.resolve();

function save() {
  const snapshot = structuredClone(settings);
  status.textContent = "Saving…";
  saveQueue = saveQueue.then(() => browser.storage.local.set({ [STORAGE_KEY]: snapshot }))
    .then(() => { status.textContent = "Saved"; })
    .catch(() => { status.textContent = "Could not save settings."; });
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function updateModeUI() {
  const random = settings.mode === "random";
  modeSelect.value = settings.mode;
  randomPool.hidden = !random;
  animalLabel.textContent = random ? "Edit controls for" : "Animal";
  animalHelp.hidden = !random;
}

function renderRandomPool() {
  randomAnimalsHost.replaceChildren();
  for (const key of ANIMAL_KEYS) {
    const row = element("label", "pool-choice");
    const checkbox = element("input") as HTMLInputElement;
    checkbox.type = "checkbox";
    checkbox.value = key;
    checkbox.checked = settings.randomAnimals.includes(key);
    checkbox.addEventListener("change", () => {
      const pool = new Set(settings.randomAnimals);
      if (checkbox.checked) pool.add(key);
      else pool.delete(key);
      if (pool.size === 0) {
        checkbox.checked = true;
        status.textContent = "Choose at least one animal for Random mode.";
        return;
      }
      settings.randomAnimals = ANIMAL_KEYS.filter((animal) => pool.has(animal));
      save();
    });
    row.append(checkbox, element("span", "", ANIMALS[key].label));
    randomAnimalsHost.append(row);
  }
}

function valueFor(key: string) {
  return settings.tuning[settings.animal]?.[key] ?? ANIMALS[settings.animal].defaults[key];
}

function setTuning(key: string, value: number | boolean) {
  const defaults = ANIMALS[settings.animal].defaults;
  const next = { ...settings.tuning[settings.animal] };
  if (value === defaults[key]) delete next[key];
  else next[key] = value;
  if (Object.keys(next).length) settings.tuning[settings.animal] = next;
  else delete settings.tuning[settings.animal];
  save();
}

function rangeRow(label: string, hint: string, min: number, max: number, step: number, value: number, onInput: (value: number) => void) {
  const row = element("div", "control");
  const heading = element("div", "control-heading");
  const title = element("label", "control-label", label);
  const output = element("output", "control-value");
  const input = element("input") as HTMLInputElement;
  input.type = "range";
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  const id = `control-${Math.random().toString(36).slice(2)}`;
  input.id = id;
  title.htmlFor = id;
  const show = () => { output.value = Number(input.value).toFixed(step >= 1 ? 0 : Math.min(3, Math.ceil(-Math.log10(step)))); };
  show();
  input.addEventListener("input", () => { show(); onInput(Number(input.value)); });
  heading.append(title, output);
  row.append(heading, input, element("p", "hint", hint));
  return { row, input };
}

function addTuningSection(title: string, specs: KnobSpec[]) {
  if (!specs.length) return;
  const section = element("section", "card");
  section.append(element("h2", "", title));
  const refreshDisabled: (() => void)[] = [];
  for (const spec of specs) {
    if ("toggle" in spec) {
      const row = element("label", "control toggle");
      const text = element("span", "control-label", spec.label);
      const input = element("input") as HTMLInputElement;
      input.type = "checkbox";
      input.checked = Boolean(valueFor(spec.key));
      input.addEventListener("change", () => {
        setTuning(spec.key, input.checked);
        refreshDisabled.forEach((refresh) => refresh());
      });
      row.append(text, input, element("span", "hint", spec.hint));
      section.append(row);
    } else {
      const { row, input } = rangeRow(spec.label, spec.hint, spec.min, spec.max, spec.step,
        Number(valueFor(spec.key)), (value) => setTuning(spec.key, value));
      if (spec.disabledWhen) {
        const refresh = () => { input.disabled = Boolean(valueFor(spec.disabledWhen!)); };
        refreshDisabled.push(refresh);
        refresh();
      }
      section.append(row);
    }
  }
  controlsHost.append(section);
}

function renderControls() {
  controlsHost.replaceChildren();
  for (const [title, specs] of controlsFor(settings.animal)) addTuningSection(title, specs);
  const animalReset = element("button", "reset", `Reset ${ANIMALS[settings.animal].label.toLowerCase()} controls`);
  animalReset.type = "button";
  animalReset.addEventListener("click", () => {
    delete settings.tuning[settings.animal];
    save();
    renderControls();
  });
  controlsHost.append(animalReset);

  const glass = element("section", "card");
  glass.append(element("h2", "", "Search glass"));
  for (const spec of GLASS_CONTROLS) {
    const value = settings.glass[settings.animal]?.[spec.key] ?? GLASS_DEFAULTS[spec.key];
    const { row } = rangeRow(spec.label, spec.hint, spec.min, spec.max, spec.step, value, (next) => {
      const values = { ...settings.glass[settings.animal] };
      if (next === GLASS_DEFAULTS[spec.key]) delete values[spec.key];
      else values[spec.key] = next;
      if (Object.keys(values).length) settings.glass[settings.animal] = values;
      else delete settings.glass[settings.animal];
      save();
    });
    glass.append(row);
  }
  const glassReset = element("button", "reset", `Reset glass for ${ANIMALS[settings.animal].label.toLowerCase()}`);
  glassReset.type = "button";
  glassReset.addEventListener("click", () => {
    delete settings.glass[settings.animal];
    save();
    renderControls();
  });
  glass.append(glassReset);
  controlsHost.append(glass);
}

for (const key of ANIMAL_KEYS) {
  const option = document.createElement("option");
  option.value = key;
  option.textContent = ANIMALS[key].label;
  animalSelect.append(option);
}

animalSelect.addEventListener("change", () => {
  settings.animal = animalSelect.value as AnimalKey;
  save();
  renderControls();
});
modeSelect.addEventListener("change", () => {
  settings.mode = modeSelect.value === "random" ? "random" : "single";
  updateModeUI();
  save();
});
nameInput.addEventListener("input", () => {
  settings.name = nameInput.value;
  save();
});

loadSettings().then((loaded) => {
  settings = loaded;
  animalSelect.value = settings.animal;
  nameInput.value = settings.name;
  updateModeUI();
  renderRandomPool();
  renderControls();
}).catch(() => { status.textContent = "Could not load settings."; });
