import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import archiver from 'archiver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const releaseDir = path.join(root, 'release');

function readPackageVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  return pkg.version || '0.0.0';
}

function run(cmd, args, options = {}) {
  const res = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });
  if (res.error) throw res.error;
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

function zipDirectoryContents(sourceDir, outFile) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outFile);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

function applyEnvGeckoId(stagingManifestPath) {
  const id = process.env.FIREFOX_GECKO_ADDON_ID?.trim();
  if (!id) return;
  const manifest = JSON.parse(fs.readFileSync(stagingManifestPath, 'utf8'));
  manifest.browser_specific_settings = manifest.browser_specific_settings || {};
  manifest.browser_specific_settings.gecko = manifest.browser_specific_settings.gecko || {};
  manifest.browser_specific_settings.gecko.id = id;
  fs.writeFileSync(stagingManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir);
}

async function main() {
  const version = readPackageVersion();
  const chromiumZipName = `malayalam-instant-dictionary-chromium-v${version}.zip`;
  const firefoxUnsignedName = `malayalam-instant-dictionary-firefox-unsigned-v${version}.zip`;
  const firefoxSignedName = `malayalam-instant-dictionary-firefox-v${version}.xpi`;

  run('npm', ['run', 'build']);

  if (!fs.existsSync(distDir)) {
    console.error('dist/ missing after build.');
    process.exit(1);
  }

  fs.mkdirSync(releaseDir, { recursive: true });

  const chromiumZipPath = path.join(releaseDir, chromiumZipName);
  console.log(`Writing ${chromiumZipPath}`);
  await zipDirectoryContents(distDir, chromiumZipPath);

  const stagingDir = path.join(releaseDir, '.firefox-staging');
  fs.rmSync(stagingDir, { recursive: true, force: true });
  copyDirSync(distDir, stagingDir);

  const stagingManifest = path.join(stagingDir, 'manifest.json');
  if (fs.existsSync(stagingManifest)) {
    applyEnvGeckoId(stagingManifest);
  }

  console.log('Running web-ext build (Firefox unsigned)...');
  run('npx', [
    'web-ext',
    'build',
    '--source-dir',
    stagingDir,
    '--artifacts-dir',
    releaseDir,
    '--filename',
    firefoxUnsignedName,
    '--overwrite-dest',
  ]);

  const unsignedPath = path.join(releaseDir, firefoxUnsignedName);
  if (fs.existsSync(unsignedPath)) {
    console.log(`Firefox unsigned: ${unsignedPath}`);
  } else {
    console.warn(`Expected unsigned zip not found at ${unsignedPath}`);
  }

  const apiKey = process.env.WEB_EXT_API_KEY?.trim();
  const apiSecret = process.env.WEB_EXT_API_SECRET?.trim();

  if (apiKey && apiSecret) {
    const signArtifactsDir = path.join(releaseDir, '.web-ext-sign');
    fs.rmSync(signArtifactsDir, { recursive: true, force: true });
    fs.mkdirSync(signArtifactsDir, { recursive: true });

    const channel = (process.env.WEB_EXT_CHANNEL || 'unlisted').trim();
    console.log(`Running web-ext sign (channel: ${channel})...`);

    const listedMetaPath = path.join(__dirname, 'amo-listed-sign-metadata.json');
    const signArgs = [
      'web-ext',
      'sign',
      '--source-dir',
      stagingDir,
      '--artifacts-dir',
      signArtifactsDir,
      '--api-key',
      apiKey,
      '--api-secret',
      apiSecret,
      '--channel',
      channel,
    ];
    if (channel === 'listed' && fs.existsSync(listedMetaPath)) {
      signArgs.push('--amo-metadata', listedMetaPath);
    }

    run('npx', signArgs);

    const xpis = listFiles(signArtifactsDir).filter((f) => f.endsWith('.xpi'));
    if (xpis.length === 1) {
      const from = path.join(signArtifactsDir, xpis[0]);
      const to = path.join(releaseDir, firefoxSignedName);
      fs.renameSync(from, to);
      console.log(`Firefox signed: ${to}`);
    } else {
      console.warn('Expected exactly one .xpi from web-ext sign; check', signArtifactsDir, xpis);
    }

    fs.rmSync(signArtifactsDir, { recursive: true, force: true });
  } else {
    console.log('WEB_EXT_API_KEY / WEB_EXT_API_SECRET not set; skipping web-ext sign.');
  }

  fs.rmSync(stagingDir, { recursive: true, force: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
