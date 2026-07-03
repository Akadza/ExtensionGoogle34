(() => {
  const namespace = window.R34VF || (window.R34VF = {});

  const DEFAULT_SETTINGS = Object.freeze({
    enabled: true,
    showShell: true,
    sidebarCollapsed: false,

    layoutMode: "masonry",
    mediaType: "all",
    previewEnabled: true,

    hoverUnblur: true,
    brightness: 1,
    contrast: 1.04,
    saturation: 1,
    grayscale: 0,
    blur: 0,

    blacklistTags: "",
    minScore: "",
    datePeriod: "any",
    minViews: "",
    sortMode: "site"
  });

  const NUMERIC_KEYS = new Set([
    "brightness",
    "contrast",
    "saturation",
    "grayscale",
    "blur"
  ]);

  const OPTIONAL_NUMBER_KEYS = new Set([
    "minScore",
    "minViews"
  ]);

  const BOOLEAN_KEYS = new Set([
    "enabled",
    "showShell",
    "sidebarCollapsed",
    "previewEnabled",
    "hoverUnblur"
  ]);

  const ENUM_VALUES = Object.freeze({
    layoutMode: new Set(["grid", "masonry"]),
    mediaType: new Set(["all", "image", "video"]),
    datePeriod: new Set(["any", "today", "week", "month"]),
    sortMode: new Set(["site", "score-desc", "score-asc"])
  });

  function normalizeSettings(rawSettings = {}) {
    const merged = {
      ...DEFAULT_SETTINGS,
      ...rawSettings
    };

    for (const key of NUMERIC_KEYS) {
      const value = Number(merged[key]);
      merged[key] = Number.isFinite(value) ? value : DEFAULT_SETTINGS[key];
    }

    for (const key of OPTIONAL_NUMBER_KEYS) {
      if (merged[key] === null || merged[key] === undefined || merged[key] === "") {
        merged[key] = "";
      } else {
        const value = Number(merged[key]);
        merged[key] = Number.isFinite(value) ? value : "";
      }
    }

    for (const key of BOOLEAN_KEYS) {
      merged[key] = Boolean(merged[key]);
    }

    for (const [key, allowedValues] of Object.entries(ENUM_VALUES)) {
      if (!allowedValues.has(merged[key])) {
        merged[key] = DEFAULT_SETTINGS[key];
      }
    }

    merged.blacklistTags = String(merged.blacklistTags || "");

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
