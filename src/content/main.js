(() => {
  const namespace = window.R34VF || (window.R34VF = {});

  const APPLY_DEBOUNCE_MS = 120;

  const state = {
    settings: null,
    observer: null,
    applyTimerId: null,
    applying: false
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  async function start() {
    try {
      state.settings = await namespace.settings.loadSettings();
      applyAll();
      setupObserver();
      setupStorageListener();
    } catch (error) {
      console.error("R34 Visual Filter failed to start", error);
    }
  }

  function setupStorageListener() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "sync") return;

      const nextSettings = {
        ...state.settings
      };

      for (const [key, change] of Object.entries(changes)) {
        nextSettings[key] = change.newValue;
      }

      state.settings = namespace.settings.normalizeSettings(nextSettings);
      scheduleApply();
    });
  }

  function setupObserver() {
    if (state.observer) {
      state.observer.disconnect();
    }

    const target = namespace.dom.getPostListRoot();
    if (!target) return;

    state.observer = new MutationObserver((mutations) => {
      if (mutations.length === 0) return;
      if (mutations.every(isOwnMutation)) return;
      scheduleApply();
    });

    state.observer.observe(target, {
      childList: true,
      subtree: true
    });
  }

  function isOwnMutation(mutation) {
    const changedNodes = [
      ...mutation.addedNodes,
      ...mutation.removedNodes
    ];

    if (changedNodes.length === 0) return false;

    return changedNodes.every((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return true;
      return namespace.dom.isOwnNode(node);
    });
  }

  function scheduleApply() {
    if (state.applyTimerId !== null) {
      window.clearTimeout(state.applyTimerId);
    }

    state.applyTimerId = window.setTimeout(() => {
      state.applyTimerId = null;
      window.requestAnimationFrame(applyAll);
    }, APPLY_DEBOUNCE_MS);
  }

  function applyAll() {
    if (state.applying || !state.settings) return;

    state.applying = true;

    try {
      namespace.visual.apply(state.settings);
      namespace.filters.apply(state.settings);
    } catch (error) {
      console.error("R34 Visual Filter apply failed", error);
    } finally {
      state.applying = false;
    }
  }
})();
