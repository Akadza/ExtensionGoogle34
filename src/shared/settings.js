(() => {
  const namespace = window.R34VF || (window.R34VF = {});

  const DEFAULT_SETTINGS = Object.freeze({
    showShell: true,
    sidebarCollapsed: false,
    filterEnabled: true,
    layoutMode: "masonry",
    mediaType: "all",
    previewEnabled: true,
    blacklistTags: "",
    selectedTags: [],
    minScore: "",
    datePeriod: "any",
    minViews: "",
    sortMode: "site"
  });

  const OPTIONAL_NUMBER_KEYS = new Set(["minScore", "minViews"]);
  const BOOLEAN_KEYS = new Set(["showShell", "sidebarCollapsed", "filterEnabled", "previewEnabled"]);
  const ARRAY_KEYS = new Set(["selectedTags"]);

  const ENUM_VALUES = Object.freeze({
    layoutMode: new Set(["grid", "masonry"]),
    mediaType: new Set(["all", "image", "video"]),
    datePeriod: new Set(["any", "today", "week", "month"]),
    sortMode: new Set(["site", "score-desc", "score-asc"])
  });

  function normalizeSettings(rawSettings = {}) {
    const merged = {
      ...DEFAULT_SETTINGS,
      ...rawSettings,
      filterEnabled: typeof rawSettings.filterEnabled === "undefined" ? true : rawSettings.filterEnabled
    };

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

    for (const key of ARRAY_KEYS) {
      merged[key] = normalizeTagList(merged[key]);
    }

    for (const [key, allowedValues] of Object.entries(ENUM_VALUES)) {
      if (!allowedValues.has(merged[key])) {
        merged[key] = DEFAULT_SETTINGS[key];
      }
    }

    merged.blacklistTags = String(merged.blacklistTags || "");

    return merged;
  }

  function normalizeTagList(value) {
    const source = Array.isArray(value) ? value : String(value || "").split(/[,\n]+/);

    return Array.from(new Set(source
      .map((tag) => String(tag || "").trim().toLowerCase())
      .filter(Boolean)));
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
    saveSettings,
    normalizeTagList
  };
})();
