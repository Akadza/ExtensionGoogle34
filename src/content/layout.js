(() => {
  const namespace = window.R34VF || (window.R34VF = {});

  function apply(settings) {
    const root = namespace.dom.getPostListRoot();
    if (!root) return;

    root.classList.toggle("r34vf-post-root", settings.enabled);
    root.classList.toggle("r34vf-grid-root", settings.enabled && settings.layoutMode === "grid");
    root.classList.toggle("r34vf-masonry-root", settings.enabled && settings.layoutMode === "masonry");

    const cards = namespace.dom.findPostCards(root);
    cards.forEach((card) => prepareCard(card, settings));
  }

  function prepareCard(card, settings) {
    if (!settings.enabled) {
      card.classList.remove("r34vf-card", "r34vf-card-video", "r34vf-card-image");
      return;
    }

    const meta = namespace.dom.getPostMeta(card);

    card.classList.add("r34vf-card");
    card.classList.toggle("r34vf-card-video", meta.mediaType === "video");
    card.classList.toggle("r34vf-card-image", meta.mediaType === "image");
    card.dataset.r34vfMediaType = meta.mediaType;

    const image = namespace.dom.getCardImage(card);
    if (image) {
      image.loading = "lazy";
      image.decoding = "async";
    }
  }

  function clear() {
    const root = namespace.dom.getPostListRoot();
    root?.classList.remove("r34vf-post-root", "r34vf-grid-root", "r34vf-masonry-root");

    document.querySelectorAll(".r34vf-card").forEach((card) => {
      card.classList.remove("r34vf-card", "r34vf-card-video", "r34vf-card-image");
      delete card.dataset.r34vfMediaType;
    });
  }

  namespace.layout = {
    apply,
    clear
  };
})();
