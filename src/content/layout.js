(() => {
  const namespace = window.R34VF || (window.R34VF = {});

  const PAGE_ID = "r34vf-page";
  const GALLERY_ID = "r34vf-gallery";

  function apply(settings) {
    const page = ensurePage();
    const gallery = ensureGallery(page);
    const cards = namespace.dom.findAllPostCards();

    cards.forEach((card) => {
      if (card.parentElement !== gallery) {
        gallery.appendChild(card);
      }

      prepareCard(card);
    });

    page.classList.toggle("r34vf-page-shell-offset", settings.showShell);
    gallery.classList.toggle("r34vf-grid-root", settings.layoutMode === "grid");
    gallery.classList.toggle("r34vf-masonry-root", settings.layoutMode === "masonry");

    namespace.visual.markPageReady();
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

    const image = namespace.dom.getCardImage(card);
    if (image) {
      image.loading = "lazy";
      image.decoding = "async";
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
  }

  namespace.layout = {
    apply,
    clear
  };
})();
