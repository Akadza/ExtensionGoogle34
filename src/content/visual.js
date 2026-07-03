(() => {
  const namespace = window.R34VF || (window.R34VF = {});

  const ROOT_CLASSES = [
    "r34vf-enabled",
    "r34vf-shell-enabled",
    "r34vf-hover-unblur",
    "r34vf-layout-grid",
    "r34vf-layout-masonry"
  ];

  function apply(settings) {
    const root = document.documentElement;

    root.classList.toggle("r34vf-enabled", settings.enabled);
    root.classList.toggle("r34vf-shell-enabled", settings.enabled && settings.showShell);
    root.classList.toggle("r34vf-hover-unblur", settings.enabled && settings.hoverUnblur);
    root.classList.toggle("r34vf-layout-grid", settings.enabled && settings.layoutMode === "grid");
    root.classList.toggle("r34vf-layout-masonry", settings.enabled && settings.layoutMode === "masonry");

    root.style.setProperty("--r34vf-brightness", String(settings.brightness));
    root.style.setProperty("--r34vf-contrast", String(settings.contrast));
    root.style.setProperty("--r34vf-saturation", String(settings.saturation));
    root.style.setProperty("--r34vf-grayscale", String(settings.grayscale));
    root.style.setProperty("--r34vf-blur", `${settings.blur}px`);
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
    cleanup
  };
})();
