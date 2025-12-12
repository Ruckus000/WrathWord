#!/usr/bin/env node

/**
 * Version Bump Script
 *
 * Bumps version in package.json and syncs to all targets.
 * Also updates iOS and Android native version numbers.
 *
 * Usage:
 *   node scripts/bump-version.js patch   # 1.0.0 -> 1.0.1
 *   node scripts/bump-version.js minor   # 1.0.0 -> 1.1.0
 *   node scripts/bump-version.js major   # 1.0.0 -> 2.0.0
 *   node scripts/bump-version.js 2.0.0   # Set explicit version
 */

const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON = path.join(ROOT, 'package.json');
const IOS_PBXPROJ = path.join(
  ROOT,
  'ios',
  'WrathWord.xcodeproj',
  'project.pbxproj',
);
const ANDROID_GRADLE = path.join(ROOT, 'android', 'app', 'build.gradle');

function parseVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return {major, minor, patch};
}

function formatVersion({major, minor, patch}) {
  return `${major}.${minor}.${patch}`;
}

function bumpVersion(current, type) {
  const v = parseVersion(current);

  switch (type) {
    case 'major':
      return formatVersion({major: v.major + 1, minor: 0, patch: 0});
    case 'minor':
      return formatVersion({major: v.major, minor: v.minor + 1, patch: 0});
    case 'patch':
      return formatVersion({major: v.major, minor: v.minor, patch: v.patch + 1});
    default:
      // Assume explicit version string
      if (/^\d+\.\d+\.\d+$/.test(type)) {
        return type;
      }
      throw new Error(
        `Invalid version type: ${type}. Use major, minor, patch, or explicit version (e.g., 2.0.0)`,
      );
  }
}

function calculateBuildNumber(version) {
  const {major, minor, patch} = parseVersion(version);
  return major * 10000 + minor * 100 + patch;
}

function updatePackageJson(newVersion) {
  const content = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  content.version = newVersion;
  fs.writeFileSync(PACKAGE_JSON, JSON.stringify(content, null, 2) + '\n', 'utf8');
  console.log('  ✓ package.json');
}

function updateIosPbxproj(newVersion, buildNumber) {
  if (!fs.existsSync(IOS_PBXPROJ)) {
    console.log('  ⚠ iOS project not found, skipping');
    return;
  }

  let content = fs.readFileSync(IOS_PBXPROJ, 'utf8');

  // Update MARKETING_VERSION (display version)
  content = content.replace(
    /MARKETING_VERSION = [\d.]+;/g,
    `MARKETING_VERSION = ${newVersion};`,
  );

  // Update CURRENT_PROJECT_VERSION (build number)
  content = content.replace(
    /CURRENT_PROJECT_VERSION = \d+;/g,
    `CURRENT_PROJECT_VERSION = ${buildNumber};`,
  );

  fs.writeFileSync(IOS_PBXPROJ, content, 'utf8');
  console.log('  ✓ iOS project.pbxproj');
}

function updateAndroidGradle(newVersion, buildNumber) {
  if (!fs.existsSync(ANDROID_GRADLE)) {
    console.log('  ⚠ Android build.gradle not found, skipping');
    return;
  }

  let content = fs.readFileSync(ANDROID_GRADLE, 'utf8');

  // Update versionName
  content = content.replace(
    /versionName\s+["'][\d.]+["']/,
    `versionName "${newVersion}"`,
  );

  // Update versionCode
  content = content.replace(/versionCode\s+\d+/, `versionCode ${buildNumber}`);

  fs.writeFileSync(ANDROID_GRADLE, content, 'utf8');
  console.log('  ✓ Android build.gradle');
}

function main() {
  const arg = process.argv[2];

  if (!arg) {
    console.error(
      'Usage: node scripts/bump-version.js <major|minor|patch|x.y.z>',
    );
    process.exit(1);
  }

  // Read current version
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  const currentVersion = packageJson.version;

  // Calculate new version
  const newVersion = bumpVersion(currentVersion, arg);
  const buildNumber = calculateBuildNumber(newVersion);

  console.log(
    `\nBumping version: ${currentVersion} → ${newVersion} (build ${buildNumber})\n`,
  );

  // Update all files
  updatePackageJson(newVersion);
  updateIosPbxproj(newVersion, buildNumber);
  updateAndroidGradle(newVersion, buildNumber);

  // Sync TypeScript version file
  console.log('\nSyncing TypeScript version...');
  execSync('node scripts/sync-version.js', {cwd: ROOT, stdio: 'inherit'});

  console.log(`\n✅ Version bumped to ${newVersion}\n`);
  console.log('Next steps:');
  console.log(`  1. Commit: git commit -am "chore: bump version to ${newVersion}"`);
  console.log(`  2. Tag: git tag v${newVersion}`);
  console.log('  3. Push: git push && git push --tags\n');
}

main();
