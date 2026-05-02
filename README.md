# Malayalam Instant Dictionary

**Malayalam Instant Dictionary** is a browser extension (Manifest V3) that provides quick English-to-Malayalam word lookups. Double-click a word on a page to open a popup with its Malayalam meaning (via Olam).

It targets **Chromium** (Chrome, Edge, etc.) and **Firefox**.

## Features

- Instant lookups by double-clicking a word on almost any site
- Small popup UI; no extra setup after install
- Same codebase for Chromium and Firefox (MV3), with packaging for both

## Installation

Published builds:

- [**Chrome Web Store**](https://chromewebstore.google.com/detail/malayalam-instant-diction/aoablanmkdmgfabgbejljmlhpnedmpci)
- [**Microsoft Edge Add-ons**](https://microsoftedge.microsoft.com/addons/detail/malayalam-instant-diction/keegdlhklgpeeibhbeklehjdgpmgeame)
- [**Firefox Add-ons**](https://addons.mozilla.org/en-US/firefox/addon/5bde4a908989418390a0/)

**Firefox:** after the add-on is approved on Mozilla Add-ons (AMO), install it from your product page on [addons.mozilla.org](https://addons.mozilla.org/firefox/). Until then you can load a development build from `dist/` (see below).

## How to use

1. Install the extension from a store (or load an unpacked/temporary build while developing).
2. Open a page with English text.
3. Double-click a word to see its Malayalam meaning in the popup.

## Development

### Prerequisites

- Node.js 18+ and npm

### Install and build

```bash
npm install
npm run build
```

Webpack writes a production bundle to **`dist/`** (scripts, `manifest.json`, `popup.html`, icons).

### Try it locally

- **Chromium:** `chrome://extensions` → Developer mode → **Load unpacked** → choose the `dist` folder.
- **Firefox:** `about:debugging` → **This Firefox** → **Load Temporary Add-on** → pick `dist/manifest.json`.

## Packaging and release

Release artifacts are written under **`release/`** (ignored by git). Configure secrets in **`.env`** (not committed); copy **`.env.example`** and fill in values.

### `npm run package`

Runs a fresh **`npm run build`**, then:

1. **Chromium:** `release/malayalam-instant-dictionary-chromium-v<version>.zip` (zip root = contents of `dist/`, same layout as for the stores).
2. **Firefox:** `release/malayalam-instant-dictionary-firefox-unsigned-v<version>.zip` via `web-ext build`.
3. **Firefox signed:** if `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` are set (from [AMO API credentials](https://addons.mozilla.org/developers/addon/api/key/)), runs `web-ext sign`. Channel defaults to **`unlisted`** unless you set `WEB_EXT_CHANNEL` (see `.env.example`).

Optional: `FIREFOX_GECKO_ADDON_ID` overrides the Gecko id only in the Firefox staging copy (see `.env.example`).

### `npm run package:firefox-listed`

Same as `npm run package`, but signs with **`WEB_EXT_CHANNEL=listed`** so the version is submitted to the **public AMO channel**, and attaches **MIT** license metadata from `scripts/amo-listed-sign-metadata.json`. Listed reviews are manual; the CLI sets `WEB_EXT_APPROVAL_TIMEOUT=0` so it does not wait for approval. Bump **`version`** in `public/manifest.json` (and `package.json` if you want matching zip names) before each new upload if AMO reports a duplicate version.

### AMO listing helpers (optional)

These use the same JWT variables as `web-ext` and update the add-on on AMO via the [v5 API](https://addons-server.readthedocs.io/en/latest/topics/api/addons.html):

| Command | Purpose |
|--------|---------|
| `npm run amo:sync-listing` | PATCH description, homepage, tags, categories (see `scripts/sync-amo-listing.mjs`) |
| `npm run amo:upload-icon` | Upload `icons/icon128.png` as the store listing icon |

See `.env.example` for `AMO_*` overrides (GUID, locale, icon path, dry run).

## Technical notes

- **MV3:** Host access uses `host_permissions`; Firefox expects `background.scripts` alongside `background.service_worker` for AMO validation.
- **Manifest:** `public/manifest.json` is copied into `dist/` by webpack; Gecko id and `strict_min_version` live under `browser_specific_settings.gecko`.

## Contributing

Contributions are welcome: open issues or pull requests on this repository.

## Support

For bugs or ideas, open an issue on GitHub or leave a review on the store listing you use.
