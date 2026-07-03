(() => {
  const namespace = window.R34VF || (window.R34VF = {});

  const ROOT_CLASSES = [
    "r34vf-enabled",
    "r34vf-page-ready",
    "r34vf-shell-enabled",
    "r34vf-layout-grid",
    "r34vf-layout-masonry"
  ];

  function apply(settings) {
    const root = document.documentElement;

    root.classList.add("r34vf-enabled");
    root.classList.toggle("r34vf-shell-enabled", settings.showShell);
    root.classList.toggle("r34vf-layout-grid", settings.layoutMode === "grid");
    root.classList.toggle("r34vf-layout-masonry", settings.layoutMode === "masonry");
  }

  function markPageReady() {
    document.documentElement.classList.add("r34vf-page-ready");
  }

  function unmarkPageReady() {
    document.documentElement.classList.remove("r34vf-page-ready");
  }

  function cleanup() {
    const root = document.documentElement;

    for (const className of ROOT_CLASSES) {
      root.classList.remove(className);
    }

    document.querySelectorAll(".r34vf-hidden").forEach((node) => {
      node.classList.remove("r34vf-hidden");
    });

    namespace.ui?.unmount();
    namespace.preview?.stop();
  }

  namespace.visual = {
    apply,
    markPageReady,
    unmarkPageReady,
    cleanup
  };
})();
