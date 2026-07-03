(() => {
  const namespace = window.R34VF || (window.R34VF = {});
  const settingsApi = namespace.settings;

  const SAVE_DEBOUNCE_MS = 120;

  const fieldIds = Object.keys(settingsApi.DEFAULT_SETTINGS);
  const state = {
    saveTimerId: null
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    const settings = await settingsApi.loadSettings();
    fillForm(settings);
    bindFields();
    setStatus("Готово");

    document.getElementById("reset")?.addEventListener("click", resetSettings);
  }

  function bindFields() {
    for (const id of fieldIds) {
      const element = document.getElementById(id);
      if (!element) continue;

      element.addEventListener("input", () => {
        updateValueLabel(id);
        scheduleSave();
      });

      element.addEventListener("change", () => {
        updateValueLabel(id);
        scheduleSave();
      });
    }
  }

  function fillForm(settings) {
    for (const id of fieldIds) {
      const element = document.getElementById(id);
      if (!element) continue;

      if (element.type === "checkbox") {
        element.checked = Boolean(settings[id]);
      } else if (Array.isArray(settings[id])) {
        element.value = settings[id].join("\n");
      } else {
        element.value = settings[id] ?? "";
      }

      updateValueLabel(id);
    }
  }

  function readForm() {
    const result = {};

    for (const id of fieldIds) {
      const element = document.getElementById(id);
      if (!element) continue;

      if (element.type === "checkbox") {
        result[id] = element.checked;
      } else if (element.type === "range") {
        result[id] = Number(element.value);
      } else {
        result[id] = element.value;
      }
    }

    return settingsApi.normalizeSettings(result);
  }

  function scheduleSave() {
    setStatus("Сохраняю…");

    if (state.saveTimerId !== null) {
      window.clearTimeout(state.saveTimerId);
    }

    state.saveTimerId = window.setTimeout(saveSettings, SAVE_DEBOUNCE_MS);
  }

  async function saveSettings() {
    state.saveTimerId = null;
    await settingsApi.saveSettings(readForm());
    setStatus("Сохранено");
  }

  async function resetSettings() {
    const defaults = settingsApi.normalizeSettings(settingsApi.DEFAULT_SETTINGS);
    await settingsApi.saveSettings(defaults);
    fillForm(defaults);
    setStatus("Сброшено");
  }

  function updateValueLabel(id) {
    const element = document.getElementById(id);
    const label = document.getElementById(`${id}Value`);

    if (!element || !label) return;

    label.textContent = element.value;
  }

  function setStatus(text) {
    const status = document.getElementById("status");
    if (status) status.textContent = text;
  }
})();
