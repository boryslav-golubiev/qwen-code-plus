# Agent Contribution Instructions — Qwen Code Plus

> This project is a fork of [Qwen Code](https://github.com/QwenLM/qwen-code), rebranded and maintained under `@boryslav-golubiev/qwen-code-plus`.

---

## Quick Reference

| Item | Value |
|---|---|
| **npm scope** | `@boryslav-golubiev/` |
| **CLI command** | `qwen-plus` |
| **Main package** | `@boryslav-golubiev/qwen-code-plus` |
| **Core package** | `@boryslav-golubiev/qwen-code-plus-core` |
| **Sandbox image** | `ghcr.io/boryslav-golubiev/qwen-code-plus` |
| **GitHub repo** | `https://github.com/boryslav-golubiev/qwen-code-plus` |

---

## Package Registry

All packages were renamed from `@qwen-code/*` to `@boryslav-golubiev/*`. The full list:

| Old | New |
|---|---|
| `@qwen-code/qwen-code` | `@boryslav-golubiev/qwen-code-plus` |
| `@qwen-code/qwen-code-core` | `@boryslav-golubiev/qwen-code-plus-core` |
| `@qwen-code/qwen-code-test-utils` | `@boryslav-golubiev/qwen-code-plus-test-utils` |
| `@qwen-code/webui` | `@boryslav-golubiev/webui` |
| `@qwen-code/web-templates` | `@boryslav-golubiev/web-templates` |
| `@qwen-code/sdk` | `@boryslav-golubiev/sdk` |
| `@qwen-code/channel-base` | `@boryslav-golubiev/channel-base` |
| `@qwen-code/channel-telegram` | `@boryslav-golubiev/channel-telegram` |
| `@qwen-code/channel-weixin` | `@boryslav-golubiev/channel-weixin` |
| `@qwen-code/channel-dingtalk` | `@boryslav-golubiev/channel-dingtalk` |
| `@qwen-code/channel-plugin-example` | `@boryslav-golubiev/channel-plugin-example` |

The VS Code extension is named `qwen-code-plus-companion` (unscoped).

The channel-plugin-example package is marked as `"private": true` and is not published.

---

## How to Build

### Prerequisites
- **Node.js 20+** (use nvm: `nvm install 20 && nvm use 20`)
- npm

### Commands

```bash
# Install dependencies
npm install

# Build all packages (TypeScript compilation, Vite, etc.)
npm run build

# Bundle the CLI into a single distributable (dist/cli.js, 21 MB)
npm run bundle

# Both build + bundle
npm run build && npm run bundle
```

### Build Order
The build script (`scripts/build.js`) handles the correct order:
```
test-utils → core → web-templates → channels → cli → webui → sdk → vscode-ide-companion
```

### Development Mode
```bash
# Hot-reload dev mode
npm run dev

# Run the CLI directly without building
npm start

# Debug mode with --inspect-brk
npm run debug
```

### Verify Build
```bash
# Run the bundled CLI
node dist/cli.js --version

# Or after publishing
qwen-plus --version
```

---

## How to Publish to npm

### Step 1: Build and Bundle

```bash
npm run build && npm run bundle
```

### Step 2: Prepare the Distribution Package

```bash
npm run prepare:package
```

This script (`scripts/prepare-package.js`) creates a clean `dist/package.json` with:
- **Zero runtime dependencies** — everything is bundled into `dist/cli.js` via esbuild with `packages: 'bundle'`
- A **postinstall script** (`dist/postinstall.js`) that fixes ripgrep permissions on macOS/Linux
- The correct `bin: { "qwen-plus": "cli.js" }`
- Only optional native deps (`@lydell/node-pty`, `@teddyzhu/clipboard`)

### Step 3: Bump Version

Edit `dist/package.json` and bump the version (e.g., `0.14.6` → `0.14.7`).

```bash
# Example: bump patch in dist/
# Manually edit dist/package.json version field, or:
node -e "
  const p = require('./dist/package.json');
  const parts = p.version.split('.').map(Number);
  parts[2]++;
  p.version = parts.join('.');
  require('fs').writeFileSync('dist/package.json', JSON.stringify(p, null, 2) + '\n');
  console.log('Bumped to ' + p.version);
"
```

### Step 4: Publish the Bundled CLI

**Publish from the `dist/` directory, NOT from the workspace:**

```bash
cd dist && npm publish --access public && cd ..
```

### Step 5: Publish Support Packages (if needed)

These are published as separate workspace packages. Use dependency order:

```bash
npm publish --workspace=packages/channels/base --access public
npm publish --workspace=packages/channels/telegram --access public
npm publish --workspace=packages/channels/weixin --access public
npm publish --workspace=packages/channels/dingtalk --access public
npm publish --workspace=packages/core --access public
npm publish --workspace=packages/web-templates --access public
npm publish --workspace=packages/webui --access public
npm publish --workspace=packages/sdk-typescript --access public
npm publish --workspace=packages/vscode-ide-companion --access public
```

### Authentication
Make sure you're logged in as `boryslav-golubiev`:
```bash
npm whoami
# Should output: boryslav-golubiev
```

If not:
```bash
npm login
```

If the account has 2FA, ensure the `.npmrc` at `~/.npmrc` has a valid token:
```
//registry.npmjs.org/:_authToken=npm_YOUR_TOKEN_HERE
```

### Deprecating a Bad Release
```bash
npm deprecate @boryslav-golubiev/qwen-code-plus@0.14.X "reason for deprecation"
```

---

## How to Commit and Push

### Normal Workflow
```bash
git add <files>
git commit -m "type(scope): description"
git push origin main
```

### Bypassing Pre-commit Hook
The pre-commit hook runs ESLint on all changed files and can time out on large commits. Use `--no-verify` when committing many files:

```bash
git add -A
git commit --no-verify -m "feat: description"
git push origin main
```

---

## Key Architecture Decisions

### Bundled CLI (No Runtime Dependencies)
The main CLI (`@boryslav-golubiev/qwen-code-plus`) is bundled via **esbuild** with `packages: 'bundle'`. This means:
- `dist/cli.js` is a **single 21 MB file** containing all JS from CLI + core + all dependencies
- The published `dist/package.json` has **`dependencies: {}`** (empty)
- Core logic is **not** a separate npm dependency at install time
- Only **optional native binaries** (`node-pty`, `clipboard`) are external

### Postinstall Ripgrep Fix
The bundled package includes `postinstall.js` (copied from `scripts/dist-postinstall.js`) that:
1. Recursively `chmod 755` all files in `vendor/ripgrep/`
2. Removes macOS quarantine attribute via `xattr`
3. Writes debug log to `.postinstall.log`

This is critical because npm publishing strips execute permissions on binaries.

### Entry Points
- **Bundled CLI**: `dist/cli.js` → bin: `qwen-plus`
- **Source CLI**: `packages/cli/index.ts` → entry point with `// --- Global Entry Point ---`
- **Core**: `packages/core/src/index.ts` — exports all core logic

### Installation Scripts
- `scripts/installation/install-qwen-plus.sh` — Linux/macOS one-liner installer
- `scripts/installation/install-qwen-plus.bat` — Windows one-liner installer

URL for users:
```bash
# Linux/macOS
curl -fsSL https://raw.githubusercontent.com/boryslav-golubiev/qwen-code-plus/refs/heads/main/scripts/installation/install-qwen-plus.sh | bash

# Windows
curl -fsSL https://raw.githubusercontent.com/boryslav-golubiev/qwen-code-plus/refs/heads/main/scripts/installation/install-qwen-plus.bat -o install.bat && install.bat
```

### GitHub Pages
Landing page at `docs/index.html`. Enable in **Settings → Pages → Deploy from branch → main → /docs**.

---

## Important Files

| File | Purpose |
|---|---|
| `package.json` | Root workspace config, `bin: { "qwen-plus": "dist/cli.js" }` |
| `esbuild.config.js` | Bundles CLI with `packages: 'bundle'` |
| `scripts/build.js` | Orchestrates build order for all packages |
| `scripts/build_package.js` | Per-package TypeScript compilation (`tsc --build`) |
| `scripts/prepare-package.js` | Creates clean `dist/package.json` for npm publish |
| `scripts/dist-postinstall.js` | Source for the ripgrep permission fix |
| `scripts/copy_bundle_assets.js` | Copies vendor/, skills/, docs/ into dist/ |
| `scripts/version.js` | Bumps versions across all packages + sandbox image URI |
| `Dockerfile` | Builds sandbox container with bundled CLI |
| `docs/index.html` | GitHub Pages landing site |

---

## Testing

```bash
# All unit tests
npm run test

# Integration tests (no sandbox)
npm run test:e2e

# Integration tests with sandbox
npm run test:integration:sandbox:none

# Single package tests
npm run test --workspace=packages/cli
npm run test --workspace=packages/core

# Type checking
npm run typecheck

# Linting
npm run lint

# Full CI pipeline
npm run preflight
```

---

## Versioning

Use the version script to bump versions atomically:

```bash
# Bump all workspace packages (except sdk)
npm run version patch    # 0.14.1 → 0.14.2
npm run version minor     # 0.14.2 → 0.15.0
npm run version major     # 0.14.2 → 1.0.0
```

This updates:
- Root `package.json` version
- All workspace `package.json` versions
- `sandboxImageUri` in root and CLI `package.json`
- Updates `package-lock.json`

---

## Troubleshooting

### "Cannot find package '@boryslav-golubiev/qwen-code-plus-core'"
This means the workspace `file:` dependency is resolving to a non-existent package. Fix:
```bash
npm install   # Re-syncs workspaces
npm run build # Rebuilds core first
```

### Ripgrep EACCES on macOS
If the postinstall didn't run or failed:
```bash
chmod +x ~/.npm-global/lib/node_modules/@boryslav-golubiev/qwen-code-plus/vendor/ripgrep/arm64-darwin/rg
```

### Build fails with "module not found"
```bash
rm -rf node_modules dist
npm install
npm run build
```

### "Cannot publish over previously published versions"
Bump the version in `dist/package.json` and try again.

---

## Release Checklist

1. Pull latest: `git pull origin main`
2. Make changes
3. `npm run build && npm run bundle`
4. `npm run prepare:package`
5. Edit `dist/package.json` — bump version
6. `cd dist && npm publish --access public && cd ..`
7. `git add -A && git commit --no-verify -m "release: vX.Y.Z"`
8. `git push origin main`
9. (Optional) Deprecate old broken versions

---

## Notes for Future Agents

- **Never** publish from `packages/cli/` directly — always from `dist/` after `npm run bundle && npm run prepare:package`
- **Never** add `@boryslav-golubiev/qwen-code-plus-core` as a runtime dependency in the published CLI — it must stay bundled
- **Always** keep `scripts/dist-postinstall.js` and `scripts/prepare-package.js` in sync — the latter copies the former into `dist/`
- The `dist/` directory is **gitignored** — it's generated fresh for each publish
- Commit and push **before** publishing so the git tag matches the npm version
- If the pre-commit hook times out, use `--no-verify` — it's safe for large commits
