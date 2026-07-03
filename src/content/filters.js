(() => {
  const namespace = window.R34VF || (window.R34VF = {});

  function apply(settings) {
    const root = namespace.dom.getPostListRoot();
    const cards = namespace.dom.findPostCards(root);

    if (!settings.enabled) {
      clear(cards);
      return {
        hidden: 0,
        total: cards.length
      };
    }

    const blacklist = parseBlacklist(settings.blacklistTags);
    const minScore = normalizeOptionalNumber(settings.minScore);
    const minViews = normalizeOptionalNumber(settings.minViews);
    let hidden = 0;

    for (const card of cards) {
      const meta = namespace.dom.getPostMeta(card);
      const tags = extractTags(meta.rawText);

      const shouldHide = shouldHideByMediaType(meta.mediaType, settings.mediaType)
        || hasBlacklistedTag(tags, blacklist)
        || shouldHideForNumber(meta.score, minScore)
        || shouldHideForNumber(meta.views, minViews)
        || shouldHideForDate(meta.date, settings.datePeriod);

      card.classList.toggle("r34vf-hidden", shouldHide);

      if (shouldHide) {
        hidden += 1;
      }
    }

    updateStats(hidden, cards.length);

    return {
      hidden,
      total: cards.length
    };
  }

  function clear(cards = []) {
    const nodes = cards.length > 0
      ? cards
      : Array.from(document.querySelectorAll(".r34vf-hidden"));

    nodes.forEach((node) => node.classList.remove("r34vf-hidden"));
    updateStats(0, nodes.length);
  }

  function updateStats(hidden, total) {
    const shell = document.getElementById("r34vf-shell");
    const target = shell?.querySelector("[data-r34vf-stats]");
    if (target) target.textContent = `${hidden}/${total} hidden`;
  }

  function shouldHideByMediaType(cardMediaType, selectedMediaType) {
    if (selectedMediaType === "all") return false;
    return cardMediaType !== selectedMediaType;
  }

  function parseBlacklist(value) {
    return String(value || "")
      .split(/[\n,]+/)
      .map((tag) => normalizeTag(tag))
      .filter(Boolean);
  }

  function normalizeTag(tag) {
    return String(tag || "")
      .trim()
      .toLowerCase()
      .replace(/^tag:/, "");
  }

  function extractTags(rawText) {
    return rawText
      .replace(/%20/g, " ")
      .replace(/\+/g, " ")
      .replace(/[()[\]{}"'.,;:!?<>]/g, " ")
      .split(/\s+/)
      .map((tag) => normalizeTag(tag))
      .filter(Boolean);
  }

  function hasBlacklistedTag(tags, blacklist) {
    if (blacklist.length === 0) return false;

    const tagSet = new Set(tags);

    return blacklist.some((blockedTag) => {
      if (!blockedTag.includes("*")) {
        return tagSet.has(blockedTag);
      }

      const regex = wildcardToRegex(blockedTag);
      return tags.some((tag) => regex.test(tag));
    });
  }

  function shouldHideForNumber(actualValue, minValue) {
    if (minValue === null || actualValue === null) return false;
    return actualValue < minValue;
  }

  function shouldHideForDate(dateValue, period) {
    if (!dateValue || period === "any") return false;

    const date = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(date.getTime())) return false;

    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    if (period === "week") {
      start.setDate(start.getDate() - 7);
    } else if (period === "month") {
      start.setMonth(start.getMonth() - 1);
    }

    return date < start;
  }

  function normalizeOptionalNumber(value) {
    if (value === "" || value === null || value === undefined) return null;

    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function wildcardToRegex(pattern) {
    const escaped = String(pattern)
      .split("*")
      .map(escapeRegExp)
      .join(".*");

    return new RegExp(`^${escaped}$`, "i");
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  namespace.filters = {
    apply,
    clear
  };
})();
