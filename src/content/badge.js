(() => {
  const namespace = window.R34VF || (window.R34VF = {});

  const BADGE_ID = "r34vf-badge";

  function getBadge() {
    return document.getElementById(BADGE_ID);
  }

  function ensureBadge() {
    let badge = getBadge();

    if (!badge) {
      badge = document.createElement("div");
      badge.id = BADGE_ID;
      badge.setAttribute("aria-hidden", "true");
      badge.setAttribute("data-r34vf", "badge");
      document.body.appendChild(badge);
    }

    return badge;
  }

  function render(settings, hiddenCount, totalCount) {
    if (!settings.enabled || !settings.showBadge) {
      remove();
      return;
    }

    const badge = ensureBadge();
    badge.textContent = `R34VF: hidden ${hiddenCount}/${totalCount}`;
  }

  function remove() {
    getBadge()?.remove();
  }

  namespace.badge = {
    BADGE_ID,
    render,
    remove
  };
})();
