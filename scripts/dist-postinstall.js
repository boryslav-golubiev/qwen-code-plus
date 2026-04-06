/**
 * Postinstall script: Fix execute permissions on ripgrep binaries
 * and remove macOS quarantine attributes.
 */

import { chmodSync, statSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { platform } from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkgRoot = __dirname;

const logPath = join(pkgRoot, '.postinstall.log');
function log(msg) {
  try { writeFileSync(logPath, msg + '\n', { flag: 'a' }); } catch {}
  console.log('postinstall:', msg);
}

log('Starting postinstall...');
log('Package root: ' + pkgRoot);
log('Platform: ' + platform());
log('CWD: ' + process.cwd());

const vendorDir = join(pkgRoot, 'vendor', 'ripgrep');
if (!existsSync(vendorDir)) {
  log('ERROR: vendor/ripgrep not found at ' + vendorDir);
  process.exit(0);
}

try {
  // Recursively chmod 755 ALL files in vendor/ripgrep/
  function fixAll(dir) {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fp = join(dir, entry);
      const st = statSync(fp);
      if (st.isDirectory()) {
        fixAll(fp);
      } else {
        try {
          chmodSync(fp, 0o755);
          log('chmod 755: ' + fp.replace(pkgRoot + '/', ''));
        } catch (e) {
          log('chmod failed: ' + fp.replace(pkgRoot + '/', '') + ' → ' + e.message);
        }
      }
    }
  }
  fixAll(vendorDir);

  // Remove macOS quarantine attribute if applicable
  if (platform() === 'darwin') {
    try {
      execSync('xattr -dr com.apple.quarantine "' + vendorDir + '"', { stdio: 'pipe' });
      log('Removed macOS quarantine attribute');
    } catch (err) {
      log('xattr skipped (ok if not applicable): ' + err.message);
    }
  }

  log('Postinstall complete');
} catch (err) {
  log('FATAL ERROR: ' + err.message);
}

process.exit(0);
