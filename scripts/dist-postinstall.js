/**
 * Postinstall script: Fix execute permissions on ripgrep binaries
 * and remove macOS quarantine attributes.
 */

import { chmodSync, statSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { platform } from 'node:os';

const vendorDir = join(process.cwd(), 'vendor', 'ripgrep');
if (!existsSync(vendorDir)) {
  console.log('postinstall: vendor/ripgrep not found, skipping');
  process.exit(0);
}

try {
  // Fix permissions on all ripgrep binaries
  const platforms = readdirSync(vendorDir);
  for (const plat of platforms) {
    const rgPath = join(vendorDir, plat, plat.includes('win') ? 'rg.exe' : 'rg');
    if (existsSync(rgPath)) {
      chmodSync(rgPath, 0o755);
      console.log(`postinstall: fixed permissions on ${plat}/${plat.includes('win') ? 'rg.exe' : 'rg'}`);
    }
  }

  // Remove macOS quarantine attribute if applicable
  if (platform() === 'darwin') {
    const xattrCmd = 'xattr';
    try {
      execSync(`${xattrCmd} -dr com.apple.quarantine "${vendorDir}"`, { stdio: 'ignore' });
      console.log('postinstall: removed macOS quarantine attribute');
    } catch {
      // xattr not available, skip
    }
  }

  console.log('postinstall: ripgrep setup complete');
} catch (err) {
  console.error('postinstall: failed to fix ripgrep permissions:', err.message);
  // Don't fail the install, just warn
}

process.exit(0);
