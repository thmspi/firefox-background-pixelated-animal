import { defineConfig } from "vite";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const pagesRoot = resolve(projectRoot, "extension/pages");

export default defineConfig({
  root: pagesRoot,
  publicDir: false,
  base: "./",
  build: {
    outDir: resolve(projectRoot, ".extension-build"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        newtab: resolve(pagesRoot, "index.html"),
        options: resolve(pagesRoot, "options.html"),
        popup: resolve(pagesRoot, "popup.html"),
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
