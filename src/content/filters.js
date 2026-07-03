(() => {
  const namespace = window.R34VF || (window.R34VF = {});

  function apply(settings) {
    const root = namespace.dom.getPostListRoot();
    const cards = namespace.dom.findPostCards(root);

    if (!settings.enabled) {
      clear(cards);
      namespace.badge?.remove();
      return {
        hidden: 0,
        total: cards.length
      };
    }

    const blacklist = parseBlacklist(settings.blacklistTags);
    const minScore = normalizeMinScore(settings.minScore);
    let hidden = 0;

    for (const card of cards) {
      const rawText = namespace.dom.getCardText(card);
      const tags = extractTags(rawText);
      const score = extractScore(rawText);

      const shouldHide = hasBlacklistedTag(tags, blacklist)
        || shouldHideForScore(score, minScore);

      card.classList.toggle("r34vf-hidden", shouldHide);

      if (shouldHide) {
        hidden += 1;
      }
    }

    namespace.badge?.render(settings, hidden, cards.length);

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

  function extractScore(rawText) {
    const decodedText = rawText.replace(/%3a/gi, ":");
    const patterns = [
      /score[:=\s]+(-?\d+)/i,
      /score=(-?\d+)/i,
      /score:(-?\d+)/i
    ];

    for (const pattern of patterns) {
      const match = decodedText.match(pattern);
      if (match) {
        const value = Number(match[1]);
        return Number.isFinite(value) ? value : null;
      }
    }

    return null;
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

  function shouldHideForScore(score, minScore) {
    if (minScore === null || score === null) return false;
    return score < minScore;
  }

  function normalizeMinScore(value) {
    if (value === "" || value === null || value === undefined) return null;

    const score = Number(value);
    return Number.isFinite(score) ? score : null;
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
