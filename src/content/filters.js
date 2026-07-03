(() => {
  const namespace = window.R34VF || (window.R34VF = {});

  function apply(settings) {
    const gallery = namespace.dom.getGalleryRoot();
    const cards = gallery ? namespace.dom.findPostCards(gallery) : [];

    if (!settings.filterEnabled) {
      clear(cards);
      sortCards(gallery, cards, settings.sortMode);
      updateStats(0, cards.length);
      return {
        hidden: 0,
        total: cards.length
      };
    }

    const blacklist = parseBlacklist(settings.blacklistTags);
    const selectedTags = namespace.settings.normalizeTagList(settings.selectedTags);
    const minScore = normalizeOptionalNumber(settings.minScore);
    let hidden = 0;

    for (const card of cards) {
      const meta = namespace.dom.getPostMeta(card);
      const tags = meta.tags;

      const shouldHide = shouldHideByMediaType(meta.mediaType, settings.mediaType)
        || doesNotMatchSelectedTags(tags, selectedTags)
        || hasBlacklistedTag(tags, blacklist)
        || shouldHideForNumber(meta.score, minScore);

      card.classList.toggle("r34vf-hidden", shouldHide);

      if (shouldHide) {
        hidden += 1;
      }
    }

    sortCards(gallery, cards, settings.sortMode);
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
  }

  function sortCards(gallery, cards, sortMode) {
    if (!gallery || sortMode === "site") {
      restoreOriginalOrder(gallery, cards);
      return;
    }

    const sortedCards = [...cards].sort((firstCard, secondCard) => {
      const firstMeta = namespace.dom.getPostMeta(firstCard);
      const secondMeta = namespace.dom.getPostMeta(secondCard);
      const firstHidden = firstCard.classList.contains("r34vf-hidden");
      const secondHidden = secondCard.classList.contains("r34vf-hidden");

      if (firstHidden !== secondHidden) return firstHidden ? 1 : -1;

      const firstScore = scoreOrFallback(firstMeta.score, sortMode);
      const secondScore = scoreOrFallback(secondMeta.score, sortMode);
      const scoreCompare = sortMode === "score-asc"
        ? firstScore - secondScore
        : secondScore - firstScore;

      if (scoreCompare !== 0) return scoreCompare;

      return originalIndex(firstCard) - originalIndex(secondCard);
    });

    sortedCards.forEach((card) => gallery.appendChild(card));
  }

  function restoreOriginalOrder(gallery, cards) {
    if (!gallery) return;

    [...cards]
      .sort((firstCard, secondCard) => originalIndex(firstCard) - originalIndex(secondCard))
      .forEach((card) => gallery.appendChild(card));
  }

  function scoreOrFallback(score, sortMode) {
    if (score !== null && Number.isFinite(score)) return score;
    return sortMode === "score-asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  }

  function originalIndex(card) {
    const value = Number(card.dataset.r34vfOriginalIndex);
    return Number.isFinite(value) ? value : 0;
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

  function doesNotMatchSelectedTags(tags, selectedTags) {
    if (!selectedTags.length) return false;

    const tagSet = new Set(tags);
    return selectedTags.some((selectedTag) => !tagSet.has(selectedTag));
  }

  function parseBlacklist(value) {
    return String(value || "")
      .split(/[,\n]+/)
      .map((tag) => normalizeTag(tag))
      .filter(Boolean);
  }

  function normalizeTag(tag) {
    return String(tag || "")
      .trim()
      .toLowerCase()
      .replace(/^tag:/, "");
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
