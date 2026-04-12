import crypto from 'crypto';

export const AMO_API = 'https://addons.mozilla.org/api/v5';

export const DEFAULT_ADDON_GUID = 'malayalam-instant-dictionary@extension.local';

function b64urlJson(obj) {
  return Buffer.from(JSON.stringify(obj), 'utf8').toString('base64url');
}

/** Same JWT shape as https://addons-server.readthedocs.io/en/latest/topics/api/auth.html */
export function createAmoJwt(apiKey, apiSecret) {
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
