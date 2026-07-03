(() => {
  const namespace = window.R34VF || (window.R34VF = {});

  const POST_CARD_SELECTORS = [
    "#post-list span.thumb",
    "#post-list .thumb",
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
    if (node.id === "r34vf-badge") return false;
    if (node.closest?.("#r34vf-badge")) return false;

    const hasImage = Boolean(node.querySelector("img"));
    const hasPostLink = Boolean(
      node.querySelector("a[href*='page=post']")
      || node.querySelector("a[href*='id=']")
    );

    return hasImage && hasPostLink;
  }

  function getCardText(card) {
    const img = card.querySelector("img");
    const links = Array.from(card.querySelectorAll("a"));

    const parts = [
      card.getAttribute("title"),
      card.getAttribute("alt"),
      card.getAttribute("data-tags"),
      card.textContent,
      img?.getAttribute("title"),
      img?.getAttribute("alt"),
      img?.getAttribute("data-tags"),
      img?.dataset?.tags,
      ...links.map((link) => link.getAttribute("title")),
      ...links.map((link) => link.getAttribute("href"))
    ];

    return parts
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function isOwnNode(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
    return node.id === "r34vf-badge" || Boolean(node.closest?.("#r34vf-badge"));
  }

  namespace.dom = {
    getPostListRoot,
    findPostCards,
    getCardText,
    isOwnNode
  };
})();
