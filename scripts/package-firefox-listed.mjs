/**
 * Same as npm run package, but forces WEB_EXT_CHANNEL=listed for web-ext sign
 * so the build is submitted to the public AMO channel (when keys are in .env).
 * Does not change your .env file. Existing env wins are overridden only for this run.
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// Listed builds are reviewed by humans; do not wait for "approval" in the CLI.
const env = {
  ...process.env,
  WEB_EXT_CHANNEL: 'listed',
  WEB_EXT_APPROVAL_TIMEOUT: process.env.WEB_EXT_APPROVAL_TIMEOUT ?? '0',
};
const r = spawnSync('npm', ['run', 'package'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env,
});

process.exit(r.status ?? 1);
