import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const requiredNode = "22.22.2";
const requiredNpm = "10.9.7";
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

if (process.versions.node !== requiredNode) {
  throw new Error(`Node.js ${requiredNode} is required; found ${process.versions.node}.`);
}

const npmVersion = execFileSync(npm, ["--version"], { encoding: "utf8" }).trim();
if (npmVersion !== requiredNpm) {
  throw new Error(`npm ${requiredNpm} is required; found ${npmVersion}.`);
}

for (const args of [["ci"], ["run", "typecheck"], ["test"], ["run", "build"]]) {
  console.log(`Running npm ${args.join(" ")}`);
  execFileSync(npm, args, { cwd: root, stdio: "inherit" });
}
