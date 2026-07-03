# R34 Visual Filter

Chrome/Chromium extension for local visual changes, modern layouts and simple client-side filtering on `rule34.xxx`.

## Current features

- Fixed top shell and left filter panel.
- Two layouts: uniform grid and Pinterest-like masonry.
- Media filter: all posts, images, videos.
- Visual CSS filters: brightness, contrast, saturation, grayscale, blur.
- Blacklist by tags, including wildcard patterns like `prefix_*`.
- Minimal score filter when score metadata exists in loaded cards.
- Prepared settings for views/date filters; they need reliable metadata from DOM or an additional fetch layer.
- Hover video preview: fetches the post page lazily, extracts a video source, caches it, and plays a muted preview only while hovering.
- Settings are saved through `chrome.storage.sync`.

## Project structure

```text
manifest.json
src/
  shared/
    settings.js
  content/
    cards.css
    dom.js
    filters.js
    layout.js
    main.js
    preview.css
    preview.js
    shell.css
    tokens.css
    ui.js
    visual.js
  options/
    options.css
    options.html
    options.js
```

The content script is split into small non-module files because regular Manifest V3 content scripts are loaded as classic scripts. Each file writes only to the `window.R34VF` namespace to avoid global collisions.

## Local install

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click **Load unpacked**.
4. Select the repository folder.
5. After code changes, click reload on the extension card and refresh the target site tab.

## Filter limits

The current filters are local: they operate on cards already loaded into the page. Date, views and reliable rating filters require one of these data sources:

1. metadata already present in the post list DOM;
2. query parameters supported by the target site search;
3. an extension metadata fetch layer that opens post pages or an API endpoint in the background and caches results.

Option 3 is possible, but it must be rate-limited and cached because fetching metadata for every card can slow the site down.

## Stability notes

The content script uses a debounced `MutationObserver`. It avoids broad selectors for native site controls and styles only the extension shell plus detected post cards.
