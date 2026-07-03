(() => {
  const namespace = window.R34VF || (window.R34VF = {});

  const DEFAULT_SETTINGS = Object.freeze({
    enabled: true,
    compact: true,
    hoverUnblur: true,
    showBadge: true,

    brightness: 1,
    contrast: 1.05,
    saturation: 0.95,
    grayscale: 0,
    blur: 0,

    blacklistTags: "",
    minScore: ""
  });

  const NUMERIC_KEYS = new Set([
    "brightness",
    "contrast",
    "saturation",
    "grayscale",
    "blur"
  ]);

  const BOOLEAN_KEYS = new Set([
    "enabled",
    "compact",
    "hoverUnblur",
    "showBadge"
  ]);

  function normalizeSettings(rawSettings = {}) {
    const merged = {
      ...DEFAULT_SETTINGS,
      ...rawSettings
    };

    for (const key of NUMERIC_KEYS) {
      const value = Number(merged[key]);
      merged[key] = Number.isFinite(value) ? value : DEFAULT_SETTINGS[key];
    }

    for (const key of BOOLEAN_KEYS) {
      merged[key] = Boolean(merged[key]);
    }

    merged.blacklistTags = String(merged.blacklistTags || "");

    if (merged.minScore === null || merged.minScore === undefined || merged.minScore === "") {
      merged.minScore = "";
    } else {
      const value = Number(merged.minScore);
      merged.minScore = Number.isFinite(value) ? value : "";
    }

    return merged;
  }

  function loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
        resolve(normalizeSettings(settings));
      });
    });
  }

  function saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(normalizeSettings(settings), resolve);
    });
  }

  namespace.settings = {
    DEFAULT_SETTINGS,
    normalizeSettings,
    loadSettings,
    saveSettings
  };
})();
