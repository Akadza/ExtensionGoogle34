(() => {
  const namespace = window.R34VF || (window.R34VF = {});

  const PAGE_ID = "r34vf-page";
  const GALLERY_ID = "r34vf-gallery";

  function apply(settings) {
    const page = ensurePage();
    const gallery = ensureGallery(page);
    const cards = namespace.dom.findAllPostCards();

    if (cards.length === 0 && gallery.children.length === 0) {
      namespace.visual.unmarkPageReady();
      return;
    }

    cards.forEach((card) => {
      if (card.parentElement !== gallery) {
        if (!card.dataset.r34vfOriginalIndex) {
          card.dataset.r34vfOriginalIndex = String(gallery.children.length);
        }

        gallery.appendChild(card);
      }

      prepareCard(card);
    });

    page.classList.toggle("r34vf-page-shell-offset", settings.showShell);
    gallery.classList.toggle("r34vf-grid-root", settings.layoutMode === "grid");
    gallery.classList.toggle("r34vf-masonry-root", settings.layoutMode === "masonry");

    if (gallery.children.length > 0) {
      namespace.visual.markPageReady();
    }
  }

  function ensurePage() {
    let page = document.getElementById(PAGE_ID);
    if (page) return page;

    page = document.createElement("main");
    page.id = PAGE_ID;
    page.setAttribute("aria-label", "Filtered posts");
    document.body.appendChild(page);

    return page;
  }

  function ensureGallery(page) {
    let gallery = document.getElementById(GALLERY_ID);
    if (gallery) return gallery;

    gallery = document.createElement("section");
    gallery.id = GALLERY_ID;
    gallery.className = "r34vf-post-root";
    page.appendChild(gallery);

    return gallery;
  }

  function prepareCard(card) {
    const meta = namespace.dom.getPostMeta(card);

    card.classList.add("r34vf-card");
    card.classList.toggle("r34vf-card-video", meta.mediaType === "video");
    card.classList.toggle("r34vf-card-image", meta.mediaType === "image");
    card.dataset.r34vfMediaType = meta.mediaType;

    stripHoverTitles(card);

    const image = namespace.dom.getCardImage(card);
    if (image) {
      image.loading = "lazy";
      image.decoding = "async";
    }
  }

  function stripHoverTitles(card) {
    card.querySelectorAll("[title]").forEach((node) => {
      if (!node.dataset.r34vfOriginalTitle) {
        node.dataset.r34vfOriginalTitle = node.getAttribute("title") || "";
      }

      node.removeAttribute("title");
    });

    if (card.hasAttribute("title")) {
      card.dataset.r34vfOriginalTitle = card.getAttribute("title") || "";
      card.removeAttribute("title");
    }
  }

  function clear() {
    const page = document.getElementById(PAGE_ID);
    const gallery = document.getElementById(GALLERY_ID);

    gallery?.classList.remove("r34vf-grid-root", "r34vf-masonry-root");

    document.querySelectorAll(".r34vf-card").forEach((card) => {
      card.classList.remove("r34vf-card", "r34vf-card-video", "r34vf-card-image");
      delete card.dataset.r34vfMediaType;
    });

    page?.remove();
    namespace.visual.unmarkPageReady();
  }

  namespace.layout = {
    apply,
    clear
  };
})();
