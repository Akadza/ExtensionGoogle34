(() => {
  const namespace = window.R34VF || (window.R34VF = {});

  const APPLY_DEBOUNCE_MS = 90;

  const state = {
    settings: null,
    observer: null,
    applyTimerId: null,
    applying: false,
    storageListenerReady: false
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  async function start() {
    try {
      state.settings = await namespace.settings.loadSettings();
      namespace.preview.init();
      applyAll();
      setupObserver();
      setupStorageListener();
    } catch (error) {
      console.error("R34 Visual Filter failed to start", error);
    }
  }

  function setupStorageListener() {
    if (state.storageListenerReady) return;

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

    state.storageListenerReady = true;
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

  function handleShellSettingsChange(nextSettings) {
    state.settings = nextSettings;
    scheduleApply();
  }

  function applyAll() {
    if (state.applying || !state.settings) return;

    state.applying = true;

    try {
      if (!state.settings.enabled) {
        namespace.visual.cleanup();
        namespace.layout.clear();
        namespace.filters.clear();
        namespace.preview.setEnabled(false);
        return;
      }

      namespace.visual.apply(state.settings);
      namespace.ui.mount(state.settings, handleShellSettingsChange);
      namespace.layout.apply(state.settings);
      namespace.filters.apply(state.settings);
      namespace.preview.setEnabled(state.settings.previewEnabled);
    } catch (error) {
      console.error("R34 Visual Filter apply failed", error);
    } finally {
      state.applying = false;
    }
  }
})();
