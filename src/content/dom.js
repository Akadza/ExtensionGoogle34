(() => {
  const namespace = window.R34VF || (window.R34VF = {});

  const POST_CARD_SELECTORS = [
    "span.thumb[id^='p']",
    ".thumb[id^='p']",
    "#post-list span.thumb",
    "#post-list .thumb",
    "#post-list article",
    "#post-list a[href*='page=post'][href*='id=']",
    "#content a[href*='page=post'][href*='id=']",
    ".image-list a[href*='page=post'][href*='id=']",
    "a[href*='page=post'][href*='id=']:has(img)"
  ];

  const NON_TAG_WORDS = new Set([
    "page", "post", "posts", "comments", "comment", "forum", "wiki", "aliases", "artists",
    "tags", "pools", "my_account", "account", "help", "discord", "search", "upload", "random",
    "contact", "dmca", "about", "tos", "index", "id", "score", "rating", "artist", "copyright",
    "character", "general", "video", "videos", "image", "images", "r34vf-card", "r34vf-card-video", "r34vf-card-image"
  ]);

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
        const card = resolvePostCard(node);
        if (card && isPostCard(card)) result.add(card);
      });
    }

    return Array.from(result);
  }

  function resolvePostCard(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return null;

    const thumb = node.closest?.("span.thumb, .thumb, article");
    if (thumb && thumb.querySelector("img") && getPostLink(thumb)) return thumb;

    return node;
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
    if (card.matches?.("a[href*='page=post'][href*='id='], a[href*='id=']")) {
      return card;
    }

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
      cleanClassText(card.dataset?.r34vfOriginalClass || card.className),
      card.dataset?.r34vfOriginalTitle,
      card.getAttribute("title"),
      card.getAttribute("alt"),
      card.getAttribute("data-tags"),
      card.getAttribute("data-score"),
      card.getAttribute("data-rating"),
      card.textContent,
      cleanClassText(img?.dataset?.r34vfOriginalClass || img?.className),
      img?.dataset?.r34vfOriginalTitle,
      img?.getAttribute("title"),
      img?.getAttribute("alt"),
      img?.getAttribute("data-tags"),
      img?.getAttribute("data-score"),
      img?.dataset?.tags,
      ...links.map((link) => cleanClassText(link.dataset?.r34vfOriginalClass || link.className)),
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
    const nativeClassText = [
      card.dataset?.r34vfOriginalClass,
      cleanClassText(card.className),
      ...Array.from(card.querySelectorAll("[class]")).map((node) => cleanClassText(node.dataset?.r34vfOriginalClass || node.className))
    ].filter(Boolean).join(" ").toLowerCase();
    const imageText = [
      image?.src,
      image?.dataset?.src,
      image?.getAttribute("data-original"),
      image?.getAttribute("alt"),
      image?.dataset?.r34vfOriginalTitle,
      image?.getAttribute("title")
    ].filter(Boolean).join(" ").toLowerCase();

    const hasNativeVideoClass = /(^|\s)(video|webm|mp4|animated)(\s|$)/i.test(nativeClassText);
    const hasDuration = /\b\d{1,2}:\d{2}\b/.test(rawText);
    const hasExplicitVideoText = /\b(webm|mp4|animated_gif|duration)\b/i.test(rawText);
    const hasVideoUrl = /\.(webm|mp4)(?:$|[?#])/i.test(lowerUrl) || /\.(webm|mp4)(?:$|[?#])/i.test(imageText);

    return hasNativeVideoClass || hasDuration || hasExplicitVideoText || hasVideoUrl ? "video" : "image";
  }

  function cleanClassText(className) {
    return String(className || "")
      .split(/\s+/)
      .filter((classToken) => classToken && !classToken.startsWith("r34vf-"))
      .join(" ");
  }

  function extractTags(rawText) {
    return String(rawText || "")
      .replace(/%20/g, " ")
      .replace(/\+/g, " ")
      .replace(/[()[\]{}"'.,;!?<>]/g, " ")
      .split(/\s+/)
      .map((tag) => tag.trim().toLowerCase().replace(/^tag:/, ""))
      .filter((tag) => Boolean(tag) && !NON_TAG_WORDS.has(tag));
  }

  function collectAvailableTags(query = "") {
    const normalizedQuery = String(query || "").trim().toLowerCase();
    const tags = new Map();

    document.querySelectorAll("a[href*='tags='], a[href*='tag=']").forEach((link) => {
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
    if (NON_TAG_WORDS.has(tag)) return;

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
