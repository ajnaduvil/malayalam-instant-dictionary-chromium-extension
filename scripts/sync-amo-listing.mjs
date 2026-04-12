/**
 * Updates Mozilla AMO listing metadata via API v5 (PATCH).
 * Uses WEB_EXT_API_KEY / WEB_EXT_API_SECRET from .env (same JWT as web-ext sign).
 * @see https://addons-server.readthedocs.io/en/latest/topics/api/addons.html#edit
 * @see https://addons-server.readthedocs.io/en/latest/topics/api/auth.html
 */
import 'dotenv/config';
import crypto from 'crypto';

const AMO_API = 'https://addons.mozilla.org/api/v5';

const DEFAULT_GUID = 'malayalam-instant-dictionary@extension.local';
const DEFAULT_CHROME_URL =
  'https://chromewebstore.google.com/detail/malayalam-instant-diction/aoablanmkdmgfabgbejljmlhpnedmpci';

function b64urlJson(obj) {
  return Buffer.from(JSON.stringify(obj), 'utf8').toString('base64url');
}

function createAmoJwt(apiKey, apiSecret) {
  const header = b64urlJson({ alg: 'HS256', typ: 'JWT' });
  const iat = Math.floor(Date.now() / 1000);
  const payload = b64urlJson({
    iss: apiKey,
    jti: crypto.randomBytes(16).toString('hex'),
    iat,
    exp: iat + 240,
  });
  const sig = crypto
    .createHmac('sha256', apiSecret)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${sig}`;
}

function buildDescriptionMarkdown(chromeUrl) {
  return [
    'Look up **Malayalam** word definitions in the browser: **double-click** a word on any page to open a popup with the meaning (via Olam).',
    '',
    '### How to use',
    '',
    '- Double-click a word on a webpage.',
    '- The extension shows a compact definition popup.',
    '',
    '### Chrome Web Store',
    '',
    `The same add-on is also published [on the Chrome Web Store](${chromeUrl}).`,
  ].join('\n');
}

async function main() {
  const apiKey = process.env.WEB_EXT_API_KEY?.trim();
  const apiSecret = process.env.WEB_EXT_API_SECRET?.trim();
  if (!apiKey || !apiSecret) {
    console.error('Missing WEB_EXT_API_KEY or WEB_EXT_API_SECRET in .env');
    process.exit(1);
  }

  const guid = (process.env.AMO_ADDON_GUID || DEFAULT_GUID).trim();
  const locale = (process.env.AMO_LISTING_LOCALE || 'en-US').trim();
  const chromeUrl = (process.env.AMO_CHROME_STORE_URL || DEFAULT_CHROME_URL).trim();

  const body = {
    description: { [locale]: buildDescriptionMarkdown(chromeUrl) },
    homepage: { [locale]: chromeUrl },
    tags: ['translate', 'search'],
    categories: { firefox: ['language-support'] },
  };

  if (process.env.AMO_DRY_RUN === '1') {
    console.log(JSON.stringify(body, null, 2));
    return;
  }

  const token = createAmoJwt(apiKey, apiSecret);
  const url = `${AMO_API}/addons/addon/${encodeURIComponent(guid)}/`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `JWT ${token}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`AMO PATCH failed (${res.status}):`, text);
    process.exit(1);
  }

  const data = JSON.parse(text);
  console.log('Listing updated.');
  console.log('Edit URL:', data.edit_url || '(see AMO developer hub)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
