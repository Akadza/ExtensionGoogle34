(() => {
  const namespace = window.R34VF || (window.R34VF = {});

  const ROOT_CLASSES = [
    "r34vf-enabled",
    "r34vf-compact",
    "r34vf-hover-unblur"
  ];

  function apply(settings) {
    const root = document.documentElement;

    root.classList.toggle("r34vf-enabled", settings.enabled);
    root.classList.toggle("r34vf-compact", settings.enabled && settings.compact);
    root.classList.toggle("r34vf-hover-unblur", settings.enabled && settings.hoverUnblur);

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

    namespace.badge?.remove();
  }

  namespace.visual = {
    apply,
    cleanup
  };
})();
