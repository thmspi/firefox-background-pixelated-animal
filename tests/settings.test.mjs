import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createServer } from "vite";

const server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: "custom" });
after(() => server.close());
const { animalForTab, normalizeSettings } = await server.ssrLoadModule("/extension/settings.ts");

test("random pool keeps only known animals and never becomes empty", () => {
  const settings = normalizeSettings({
    mode: "random", animal: "koi", randomAnimals: ["frogs", "koi", "butterflies", "koi", "unknown"],
  });
  assert.equal(settings.mode, "random");
  assert.deepEqual(settings.randomAnimals, ["butterflies", "koi", "frogs"]);
  assert.deepEqual(normalizeSettings({ mode: "random", animal: "koi", randomAnimals: [] }).randomAnimals, ["koi"]);
});

test("new tabs choose from the pool while open tabs keep an allowed animal", () => {
  const settings = normalizeSettings({ mode: "random", animal: "crabs", randomAnimals: ["butterflies", "koi", "frogs"] });
  assert.equal(animalForTab(settings, undefined, undefined, () => 0), "butterflies");
  assert.equal(animalForTab(settings, undefined, undefined, () => 0.5), "koi");
  assert.equal(animalForTab(settings, undefined, undefined, () => 0.99), "frogs");
  assert.equal(animalForTab(settings, "koi", "random", () => 0), "koi");
  assert.equal(animalForTab(settings, "crabs", "random", () => 0), "butterflies");
  assert.equal(animalForTab({ ...settings, mode: "single" }, "frogs", "random"), "crabs");
});

test("animal tuning and glass survive switching and reloading", () => {
  const stored = {
    animal: "koi",
    name: "Alex",
    tuning: { butterflies: { speed: 1.5 }, koi: { speed: 0.8 } },
    glass: { butterflies: { radius: 31 }, koi: { radius: 12 } },
  };
  const selectedKoi = normalizeSettings(stored);
  assert.equal(selectedKoi.tuning.koi.speed, 0.8);
  assert.equal(selectedKoi.glass.koi.radius, 12);

  const selectedButterflies = normalizeSettings({ ...selectedKoi, animal: "butterflies" });
  assert.equal(selectedButterflies.tuning.butterflies.speed, 1.5);
  assert.equal(selectedButterflies.glass.butterflies.radius, 31);
  assert.equal(selectedButterflies.tuning.koi.speed, 0.8);
  assert.equal(selectedButterflies.glass.koi.radius, 12);
});

test("shared glass values from the previous version are copied to each animal", () => {
  const settings = normalizeSettings({ glass: { blur: 8, width: 800 } });
  assert.equal(settings.glass.butterflies.blur, 8);
  assert.equal(settings.glass.koi.blur, 8);
  assert.equal(settings.glass.crabs.width, 800);
});

test("out-of-range saved values are discarded", () => {
  const settings = normalizeSettings({
    tuning: { koi: { speed: 99 } },
    glass: { koi: { radius: -10 } },
  });
  assert.equal(settings.tuning.koi, undefined);
  assert.equal(settings.glass.koi, undefined);
});
