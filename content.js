const DEFAULT_SETTINGS = {
  enabled: true,
  compact: true,
  hoverUnblur: true,

  brightness: 1,
  contrast: 1.05,
  saturation: 0.95,
  grayscale: 0,
  blur: 0,

  blacklistTags: "",
  minScore: null
};

let currentSettings = { ...DEFAULT_SETTINGS };
let observer = null;
let lastHiddenCount = 0;

init();

async function init() {
  currentSettings = await loadSettings();
  applyVisualSettings(currentSettings);
  applyFilters(currentSettings);
  setupObserver();

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") return;

    for (const [key, change] of Object.entries(changes)) {
      currentSettings[key] = change.newValue;
    }

    applyVisualSettings(currentSettings);
    applyFilters(currentSettings);
  });
}

function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
      resolve(normalizeSettings(settings));
    });
  });
}

function normalizeSettings(settings) {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    brightness: Number(settings.brightness ?? DEFAULT_SETTINGS.brightness),
    contrast: Number(settings.contrast ?? DEFAULT_SETTINGS.contrast),
    saturation: Number(settings.saturation ?? DEFAULT_SETTINGS.saturation),
    grayscale: Number(settings.grayscale ?? DEFAULT_SETTINGS.grayscale),
    blur: Number(settings.blur ?? DEFAULT_SETTINGS.blur),
    minScore: settings.minScore === "" || settings.minScore == null
      ? null
      : Number(settings.minScore)
  };
}

function applyVisualSettings(settings) {
  const root = document.documentElement;

  root.classList.toggle("r34vf-enabled", Boolean(settings.enabled));
  root.classList.toggle("r34vf-compact", Boolean(settings.compact));
  root.classList.toggle("r34vf-hover-unblur", Boolean(settings.hoverUnblur));

  root.style.setProperty("--r34vf-brightness", String(settings.brightness));
  root.style.setProperty("--r34vf-contrast", String(settings.contrast));
  root.style.setProperty("--r34vf-saturation", String(settings.saturation));
  root.style.setProperty("--r34vf-grayscale", String(settings.grayscale));
  root.style.setProperty("--r34vf-blur", `${settings.blur}px`);
}

function applyFilters(settings) {
  const cards = findPostCards();
  const blacklist = parseBlacklist(settings.blacklistTags);

  let hiddenCount = 0;

  for (const card of cards) {
    const data = extractPostData(card);
    const shouldHideByTag = hasBlacklistedTag(data.tags, blacklist);
    const shouldHideByScore = shouldHideForScore(data.score, settings.minScore);

    const shouldHide = Boolean(settings.enabled && (shouldHideByTag || shouldHideByScore));

    card.classList.toggle("r34vf-hidden", shouldHide);

    if (shouldHide) hiddenCount += 1;
  }

  lastHiddenCount = hiddenCount;
  renderBadge(hiddenCount, cards.length);
}

function findPostCards() {
  const selectors = [
    "span.thumb",
    ".thumb",
    "#post-list span[id^='p']",
    "#post-list .image-list span",
    "#post-list a[href*='page=post']"
  ];

  const result = new Set();

  for (const selector of selectors) {
    document.querySelectorAll(selector).forEach((node) => {
      const card = node.closest("span.thumb")
        || node.closest(".thumb")
        || node.closest("span")
        || node.closest("a")
        || node;

      result.add(card);
    });
  }

  return Array.from(result);
}

function extractPostData(card) {
  const img = card.querySelector("img");
  const link = card.querySelector("a");

  const rawTextParts = [
    card.getAttribute("title"),
    card.getAttribute("alt"),
    card.textContent,
    img?.getAttribute("title"),
    img?.getAttribute("alt"),
    img?.dataset?.tags,
    link?.getAttribute("title"),
    link?.getAttribute("href")
  ].filter(Boolean);

  const rawText = rawTextParts.join(" ").toLowerCase();

  return {
    tags: extractTags(rawText),
    score: extractScore(rawText)
  };
}

function extractTags(rawText) {
  return rawText
    .replace(/[()[\]{}"'.,;:!?]/g, " ")
    .split(/\s+/)
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function extractScore(rawText) {
  const patterns = [
    /score[:=\s]+(-?\d+)/i,
    /score%3a(-?\d+)/i,
    /score=(-?\d+)/i
  ];

  for (const pattern of patterns) {
    const match = rawText.match(pattern);
    if (match) return Number(match[1]);
  }

  return null;
}

function parseBlacklist(value) {
  return String(value || "")
    .split(/[\n,]+/)
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function hasBlacklistedTag(tags, blacklist) {
  if (blacklist.length === 0) return false;

  const tagSet = new Set(tags);

  return blacklist.some((blockedTag) => {
    if (blockedTag.includes("*")) {
      const regex = new RegExp(
        "^" + blockedTag.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("\\*", ".*") + "$"
      );

      return tags.some((tag) => regex.test(tag));
    }

    return tagSet.has(blockedTag);
  });
}

function shouldHideForScore(score, minScore) {
  if (minScore == null || Number.isNaN(minScore)) return false;
  if (score == null || Number.isNaN(score)) return false;

  return score < minScore;
}

function setupObserver() {
  if (observer) observer.disconnect();

  observer = new MutationObserver(() => {
    applyVisualSettings(currentSettings);
    applyFilters(currentSettings);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function renderBadge(hiddenCount, totalCount) {
  let badge = document.querySelector(".r34vf-badge");

  if (!currentSettings.enabled) {
    badge?.remove();
    return;
  }

  if (!badge) {
    badge = document.createElement("div");
    badge.className = "r34vf-badge";
    document.body.appendChild(badge);
  }

  badge.textContent = `R34VF: hidden ${hiddenCount}/${totalCount}`;
}