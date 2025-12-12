#!/usr/bin/env node

/**
 * Version Sync Script
 *
 * Reads version from package.json and generates a TypeScript file.
 * Run automatically via `postinstall` or manually before builds.
 *
 * Usage:
 *   node scripts/sync-version.js
 *   npm run sync-version
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON = path.join(ROOT, 'package.json');
const OUTPUT_FILE = path.join(ROOT, 'src', 'config', 'version.ts');

function main() {
  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  const {version} = packageJson;

  // Parse version components
  const [major, minor, patch] = version.split('.').map(Number);

  // Generate build number from version
  // Pattern: major * 10000 + minor * 100 + patch
  // e.g., 1.2.3 -> 10203
  const buildNumber = major * 10000 + minor * 100 + patch;

  // Generate TypeScript file
  const content = `/**
 * Auto-generated version file
 *
 * DO NOT EDIT MANUALLY
 * Run \`npm run sync-version\` to regenerate
 *
 * Generated: ${new Date().toISOString()}
 */

export const APP_VERSION = '${version}';
export const BUILD_NUMBER = '${buildNumber}';

// Parsed components (useful for version comparisons)
export const VERSION_MAJOR = ${major};
export const VERSION_MINOR = ${minor};
export const VERSION_PATCH = ${patch};
`;

  // Ensure directory exists
  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {recursive: true});
  }

  // Write file
  fs.writeFileSync(OUTPUT_FILE, content, 'utf8');

  console.log(`✓ Version synced: v${version} (build ${buildNumber})`);
  console.log(`  Output: ${OUTPUT_FILE}`);
}

main();
