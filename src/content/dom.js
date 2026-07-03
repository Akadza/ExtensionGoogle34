(() => {
  const namespace = window.R34VF || (window.R34VF = {});

  const POST_CARD_SELECTORS = [
    "#post-list span.thumb",
    "#post-list .thumb",
    "#post-list article",
    "span.thumb[id^='p']",
    ".thumb[id^='p']"
  ];

  function getPostListRoot() {
    return document.querySelector("#post-list")
      || document.querySelector(".image-list")
      || document.querySelector("#content")
      || document.body;
  }

  function findPostCards(root = document) {
    const result = new Set();

    for (const selector of POST_CARD_SELECTORS) {
      root.querySelectorAll(selector).forEach((node) => {
        if (isPostCard(node)) {
          result.add(node);
        }
      });
    }

    return Array.from(result);
  }

  function isPostCard(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
    if (isOwnNode(node)) return false;

    const hasImage = Boolean(node.querySelector("img"));
    const hasPostLink = Boolean(getPostLink(node));

    return hasImage && hasPostLink;
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
      card.getAttribute("title"),
      card.getAttribute("alt"),
      card.getAttribute("data-tags"),
      card.getAttribute("data-score"),
      card.getAttribute("data-rating"),
      card.textContent,
      img?.className,
      img?.getAttribute("title"),
      img?.getAttribute("alt"),
      img?.getAttribute("data-tags"),
      img?.getAttribute("data-score"),
      img?.dataset?.tags,
      ...links.map((link) => link.className),
      ...links.map((link) => link.getAttribute("title")),
      ...links.map((link) => link.getAttribute("href"))
    ];

    return parts
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
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
      date: extractDate(rawText)
    };
  }

  function detectMediaType(card, rawText, url) {
    const lowerUrl = String(url || "").toLowerCase();

    const hasVideoClass = card.matches(".video, .webm, .mp4")
      || Boolean(card.querySelector(".video, .webm, .mp4, video"));

    const hasVideoText = /\b(video|webm|mp4|duration|animated|animated_gif)\b/i.test(rawText);
    const hasVideoUrl = /\.(webm|mp4)(?:$|[?#])/i.test(lowerUrl);

    return hasVideoClass || hasVideoText || hasVideoUrl ? "video" : "image";
  }

  function extractScore(rawText) {
    return extractNumber(rawText, [
      /score[:=\s]+(-?\d+)/i,
      /score%3a(-?\d+)/i,
      /score=(-?\d+)/i
    ]);
  }

  function extractViews(rawText) {
    return extractNumber(rawText, [
      /views?[:=\s]+(\d+)/i,
      /view_count[:=\s]+(\d+)/i,
      /views?=(\d+)/i
    ]);
  }

  function extractDate(rawText) {
    const match = rawText.match(/(?:date|created_at|posted)[:=\s]+(\d{4}-\d{2}-\d{2})/i);
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
    getPostListRoot,
    findPostCards,
    getPostLink,
    getPostUrl,
    getPostId,
    getCardImage,
    getCardText,
    getPostMeta,
    isOwnNode
  };
})();
