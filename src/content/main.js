(() => {
  const namespace = window.R34VF || (window.R34VF = {});

  const APPLY_DEBOUNCE_MS = 90;

  const state = {
    settings: null,
    observer: null,
    applyTimerId: null,
    applying: false,
    storageListenerReady: false,
    domFeaturesReady: false
  };

  start();

  async function start() {
    try {
      state.settings = await namespace.settings.loadSettings();
      namespace.visual.apply(state.settings);
      setupStorageListener();

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startDomFeatures, { once: true });
      } else {
        startDomFeatures();
      }
    } catch (error) {
      console.error("R34 Visual Filter failed to start", error);
    }
  }

  function startDomFeatures() {
    if (state.domFeaturesReady) return;

    namespace.preview.init();
    applyAll();
    setupObserver();

    state.domFeaturesReady = true;
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
      namespace.visual.apply(state.settings);
      scheduleApply();
    });

    state.storageListenerReady = true;
  }

  function setupObserver() {
    if (state.observer) {
      state.observer.disconnect();
    }

    const target = document.body;
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
    if (!state.domFeaturesReady) return;

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
    namespace.visual.apply(state.settings);
    scheduleApply();
  }

  function applyAll() {
    if (state.applying || !state.settings) return;

    state.applying = true;

    try {
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
