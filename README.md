# R34 Visual Filter

Chrome/Chromium extension for local visual changes and simple client-side filtering on `rule34.xxx`.

## What it does

- Adds a safer dark visual layer for post list pages.
- Applies image CSS filters: brightness, contrast, saturation, grayscale, blur.
- Can hide post cards by blacklist tags.
- Can hide post cards below a minimal score when the score is available in the page DOM.
- Saves settings through `chrome.storage.sync`.

## Project structure

```text
manifest.json
src/
  shared/
    settings.js
  content/
    badge.js
    dom.js
    filters.js
    main.js
    styles.css
    visual.js
  options/
    options.css
    options.html
    options.js
```

The content script is intentionally split into small non-module files because regular Manifest V3 content scripts are loaded as classic scripts. Each file writes only to the `window.R34VF` namespace to avoid global `const` collisions.

## Local install

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click **Load unpacked**.
4. Select the repository folder.
5. After code changes, click reload on the extension card and refresh the target site tab.

## Stability notes

The content script uses a debounced `MutationObserver`. It does not scan the whole document on every small DOM mutation and it does not style all page buttons/inputs, because that can break the target site's own scripts and layout.
