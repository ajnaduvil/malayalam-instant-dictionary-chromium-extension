/**
 * Uploads the AMO listing icon (separate from manifest icons in the .xpi).
 * @see https://addons-server.readthedocs.io/en/latest/topics/api/addons.html#addon-icon
 */
import 'dotenv/config';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { AMO_API, createAmoJwt, DEFAULT_ADDON_GUID } from './amo-auth.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ICON = path.join(__dirname, '..', 'icons', 'icon128.png');

async function main() {
  const apiKey = process.env.WEB_EXT_API_KEY?.trim();
  const apiSecret = process.env.WEB_EXT_API_SECRET?.trim();
  if (!apiKey || !apiSecret) {
    console.error('Missing WEB_EXT_API_KEY or WEB_EXT_API_SECRET in .env');
    process.exit(1);
  }

  const guid = (process.env.AMO_ADDON_GUID || DEFAULT_ADDON_GUID).trim();
  const iconPath = (process.env.AMO_ICON_PATH || DEFAULT_ICON).trim();

  const buf = await readFile(iconPath);
  const form = new FormData();
  form.append('icon', new Blob([buf], { type: 'image/png' }), path.basename(iconPath));

  const token = createAmoJwt(apiKey, apiSecret);
  const url = `${AMO_API}/addons/addon/${encodeURIComponent(guid)}/`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `JWT ${token}` },
    body: form,
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`AMO icon upload failed (${res.status}):`, text);
    process.exit(1);
  }

  const data = JSON.parse(text);
  console.log('Listing icon uploaded from', iconPath);
  console.log('Icon URLs:', data.icons || data.icon_url || '(processing; refresh AMO in a minute)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
