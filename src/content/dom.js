(() => {
  const namespace = window.R34VF || (window.R34VF = {});

  const POST_CARD_SELECTORS = [
    "span.thumb[id^='p']",
    ".thumb[id^='p']",
    "#post-list span.thumb",
    "#post-list .thumb",
    "#post-list article"
  ];

  function getNativeRoot() {
    return document.querySelector("#post-list")
      || document.querySelector("#content")
      || document.querySelector(".image-list")
      || document.body;
  }

  function getGalleryRoot() {
    return document.getElementById("r34vf-gallery");
  }

  function findPostCards(root = document) {
    const result = new Set();

    for (const selector of POST_CARD_SELECTORS) {
      root.querySelectorAll(selector).forEach((node) => {
        if (isPostCard(node)) result.add(node);
      });
    }

    return Array.from(result);
  }

  function findAllPostCards() {
    return findPostCards(document).filter((card) => !card.closest("#r34vf-shell"));
  }

  function isPostCard(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
    if (node.closest?.("#r34vf-shell")) return false;

    return Boolean(node.querySelector("img")) && Boolean(getPostLink(node));
  }

  function getPostLink(card) {
    return card.querySelector("a[href*='page=post'][href*='id=']")
      || card.querySelector("a[href*='id=']")
      || card.querySelector("a[href]");
  }

  function getPostUrl(card) {
    const href = getPostLink(card)?.getAttribute("href");
    if (!href) return "";

    try {
      return new URL(href, window.location.href).toString();
    } catch (_error) {
      return href;
    }
  }

  function getPostId(card) {
    const idFromNode = String(card.id || "").match(/\d+/)?.[0];
    if (idFromNode) return idFromNode;

    const url = getPostUrl(card);
    if (!url) return "";

    try {
      return new URL(url).searchParams.get("id") || "";
    } catch (_error) {
      return "";
    }
  }

  function getCardImage(card) {
    return card.querySelector("img");
  }

  function getCardText(card) {
    const img = getCardImage(card);
    const links = Array.from(card.querySelectorAll("a"));

    const parts = [
      card.className,
      card.dataset?.r34vfOriginalTitle,
      card.getAttribute("title"),
      card.getAttribute("alt"),
      card.getAttribute("data-tags"),
      card.getAttribute("data-score"),
      card.getAttribute("data-rating"),
      card.textContent,
      img?.className,
      img?.dataset?.r34vfOriginalTitle,
      img?.getAttribute("title"),
      img?.getAttribute("alt"),
      img?.getAttribute("data-tags"),
      img?.getAttribute("data-score"),
      img?.dataset?.tags,
      ...links.map((link) => link.className),
      ...links.map((link) => link.dataset?.r34vfOriginalTitle),
      ...links.map((link) => link.getAttribute("title")),
      ...links.map((link) => link.getAttribute("href"))
    ];

    return parts.filter(Boolean).join(" ").toLowerCase();
  }

  function getPostMeta(card) {
    const rawText = getCardText(card);
    const url = getPostUrl(card);
    const img = getCardImage(card);

    return {
      id: getPostId(card),
      card,
      url,
      imageUrl: img?.currentSrc || img?.src || "",
      rawText,
      mediaType: detectMediaType(card, rawText, url),
      score: extractScore(rawText),
      views: extractViews(rawText),
      date: extractDate(rawText),
      tags: extractTags(rawText)
    };
  }

  function detectMediaType(card, rawText, url) {
    const lowerUrl = String(url || "").toLowerCase();
    const image = getCardImage(card);
    const imageText = [
      image?.src,
      image?.dataset?.src,
      image?.getAttribute("data-original"),
      image?.getAttribute("alt"),
      image?.dataset?.r34vfOriginalTitle,
      image?.getAttribute("title")
    ].filter(Boolean).join(" ").toLowerCase();

    const hasVideoClass = card.matches(".video, .webm, .mp4, [class*='video']")
      || Boolean(card.querySelector(".video, .webm, .mp4, video, [class*='video']"));
    const hasDuration = /\b\d{1,2}:\d{2}\b/.test(rawText);
    const hasVideoText = /\b(video|webm|mp4|duration|animated|animated_gif)\b/i.test(rawText);
    const hasVideoUrl = /\.(webm|mp4)(?:$|[?#])/i.test(lowerUrl) || /\.(webm|mp4)(?:$|[?#])/i.test(imageText);

    return hasVideoClass || hasDuration || hasVideoText || hasVideoUrl ? "video" : "image";
  }

  function extractTags(rawText) {
    return String(rawText || "")
      .replace(/%20/g, " ")
      .replace(/\+/g, " ")
      .replace(/[()[\]{}"'.,;!?<>]/g, " ")
      .split(/\s+/)
      .map((tag) => tag.trim().toLowerCase().replace(/^tag:/, ""))
      .filter(Boolean);
  }

  function collectAvailableTags(query = "") {
    const normalizedQuery = String(query || "").trim().toLowerCase();
    const tags = new Map();

    document.querySelectorAll("a[href*='tags='], a[href*='tag='], a[href*='page=post']").forEach((link) => {
      const linkText = String(link.textContent || "").trim();
      const title = String(link.getAttribute("title") || link.dataset?.r34vfOriginalTitle || "").trim();
      const hrefTags = extractTagsFromUrl(link.getAttribute("href") || "");

      [...hrefTags, linkText, title].forEach((value) => addTag(tags, value));
    });

    findAllPostCards().forEach((card) => {
      getPostMeta(card).tags.forEach((tag) => addTag(tags, tag));
    });

    return Array.from(tags.keys())
      .filter((tag) => !normalizedQuery || tag.includes(normalizedQuery))
      .filter((tag) => tag.length > 1 && !/^\d+$/.test(tag))
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 18);
  }

  function addTag(map, value) {
    const tag = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/^\?\s*[+-]\s*/, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_:\-]+/g, "");

    if (!tag || tag.length < 2 || tag.length > 64) return;
    if (["page", "post", "index", "id", "tags", "score", "rating", "artist", "copyright", "character", "general"].includes(tag)) return;

    map.set(tag, true);
  }

  function extractTagsFromUrl(href) {
    try {
      const url = new URL(href, window.location.href);
      const raw = url.searchParams.get("tags") || url.searchParams.get("tag") || "";
      return raw.split(/\s+/).filter(Boolean);
    } catch (_error) {
      return [];
    }
  }

  function extractScore(rawText) {
    return extractNumber(rawText, [/score[:=\s]+(-?\d+)/i, /score%3a(-?\d+)/i, /score=(-?\d+)/i]);
  }

  function extractViews(rawText) {
    return extractNumber(rawText, [/views?[:=\s]+(\d+)/i, /view_count[:=\s]+(\d+)/i, /views?=(\d+)/i]);
  }

  function extractDate(rawText) {
    const match = String(rawText || "").match(/(?:date|created_at|posted)[:=\s]+(\d{4}-\d{2}-\d{2})/i);
    return match ? match[1] : "";
  }

  function extractNumber(rawText, patterns) {
    const decodedText = String(rawText || "").replace(/%3a/gi, ":");

    for (const pattern of patterns) {
      const match = decodedText.match(pattern);
      if (!match) continue;
      const value = Number(match[1]);
      if (Number.isFinite(value)) return value;
    }

    return null;
  }

  function isOwnNode(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
    return Boolean(node.closest?.("#r34vf-shell, #r34vf-preview-layer"));
  }

  namespace.dom = {
    getNativeRoot,
    getGalleryRoot,
    findPostCards,
    findAllPostCards,
    getPostLink,
    getPostUrl,
    getPostId,
    getCardImage,
    getCardText,
    getPostMeta,
    collectAvailableTags,
    isOwnNode
  };
})();
