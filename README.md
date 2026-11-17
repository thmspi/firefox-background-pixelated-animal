# bg-ascii-animals for Firefox

Animated ASCII animals on every new tab, with a search box that uses your default Firefox search engine.

![bg-ascii-animals new tab showing koi, search, and Firefox shortcuts](docs/images/new-tab-preview.png)

## Original project

This extension adapts [DesignerStephen1/ascii-animals](https://github.com/DesignerStephen1/ascii-animals), by Stephen Zhang, with its original animal engine and renderer. The upstream project is MIT licensed; the original copyright and license notice are retained in [LICENSE](LICENSE).

## Load and build

The checked-in root files are ready to load. In Firefox, open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `manifest.json` at the repository root. Open a new tab to see the extension. Temporary add-ons are removed when Firefox restarts.

After editing the source, rebuild with Node.js and npm:

```sh
npm ci
npm run typecheck
npm test
npm run build
```

After rebuilding, click **Reload** for bg-ascii-animals on the debugging page.

To personalize it, click the **bg-ascii-animals toolbar button → Open settings**. The settings page is also available through **Add-ons and themes → Extensions → bg-ascii-animals → Preferences**. Choose one animal or **Random animal**, then select the animals in the random pool. Random mode picks one animal for each new tab. Set an optional greeting name and adjust movement, appearance, and search glass. Settings are saved in `browser.storage.local` and update open animal tabs. The new-tab page has no personalization controls.

Firefox's pinned New Tab shortcuts are displayed below search using the `topSites` API. The extension reads Firefox's existing shortcut list; it does not change the pins.

The root directory is the loadable extension. It requests `storage` for preferences, `search` to use Firefox's default search engine in the current tab, and `topSites` to show Firefox's New Tab shortcuts. It makes no network requests of its own.

## Source

`src/` contains the animal engine and renderer. `extension/` contains the Firefox new-tab, popup, settings code, and editable HTML templates. `npm run build` compiles them into the root `index.html`, `popup.html`, `options.html`, and `assets/`. The root `manifest.json` points to those compiled pages.

Movement, appearance, and search glass values are stored per animal, including in Random mode. Switching animals restores each animal's values. Settings from the earlier version, where glass was shared, are carried over to every animal on first load.

## Firefox Add-ons source review

The add-on ZIP contains the built files: `manifest.json`, `icons/`, `index.html`, `options.html`, `popup.html`, `assets/`, and `LICENSE`. The separate source ZIP contains this README, `docs/images/` (including the original and rounded logo artwork), `manifest.json`, `icons/`, `page.css`, `src/`, `extension/`, `scripts/`, `tests/`, `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, and `LICENSE`.

### Required environment and installation

The submitted add-on was built and checked on **macOS 15.7.7, x86_64**, with **Node.js 22.22.2** and its bundled **npm 10.9.7**. Use these exact Node.js and npm versions to reproduce the submitted build. The build script also supports Linux; Mozilla reviewers using Ubuntu 24.04 ARM64 should use the Linux ARM64 download of the same Node.js release. The build has been verified byte for byte on macOS x86_64; it has not been independently verified on Linux ARM64.

1. Download and install the appropriate package for your operating system and CPU from the [official Node.js 22.22.2 archive](https://nodejs.org/en/download/archive/v22.22.2). That release includes npm 10.9.7. On macOS, use the `.pkg` installer. On Ubuntu ARM64, use the `linux-arm64` archive and make its `bin` directory available in your shell.
2. In a new terminal, check `node --version` prints `v22.22.2` and `npm --version` prints `10.9.7`. The script below stops if either version differs.
3. Extract the source ZIP. In its top-level directory, run:

   ```sh
   node scripts/install-and-build.mjs
   ```

This script runs `npm ci` to install the exact dependency versions from `package-lock.json`, then `npm run typecheck`, `npm test`, and `npm run build`. The build uses the open source TypeScript and Vite packages from npm and writes `index.html`, `options.html`, `popup.html`, and `assets/` at the source directory root. `manifest.json`, `icons/`, and `LICENSE` are already present there and are copied into the add-on ZIP without modification. No private repository, credentials, environment variables, or other downloaded build tools are needed.

To verify the result, extract the add-on ZIP separately and compare its `assets/` directory and three HTML pages with those generated in the source directory. These files should be byte identical. The source ZIP contains the original readable TypeScript, CSS, HTML templates, and build scripts; it does not contain the bundled or minified JavaScript. To test in Firefox 142 or later, load the generated root `manifest.json`, open a new tab, and click the toolbar button to open settings.
