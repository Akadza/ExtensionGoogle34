const DEFAULT_SETTINGS = {
  enabled: true,
  compact: true,
  hoverUnblur: true,

  brightness: 1,
  contrast: 1.05,
  saturation: 0.95,
  grayscale: 0,
  blur: 0,

  blacklistTags: "",
  minScore: ""
};

const ids = Object.keys(DEFAULT_SETTINGS);

document.addEventListener("DOMContentLoaded", async () => {
  const settings = await loadSettings();
  fillForm(settings);
  bindLiveLabels();

  document.querySelector("#save").addEventListener("click", saveSettings);
  document.querySelector("#reset").addEventListener("click", resetSettings);

  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;

    el.addEventListener("input", () => {
      updateValueLabel(id);
      saveSettings();
    });
  }
});

function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
      resolve({ ...DEFAULT_SETTINGS, ...settings });
    });
  });
}

function fillForm(settings) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;

    if (el.type === "checkbox") {
      el.checked = Boolean(settings[id]);
    } else {
      el.value = settings[id] ?? "";
    }

    updateValueLabel(id);
  }
}

function getFormSettings() {
  const result = {};

  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;

    if (el.type === "checkbox") {
      result[id] = el.checked;
    } else if (el.type === "range") {
      result[id] = Number(el.value);
    } else {
      result[id] = el.value;
    }
  }

  return result;
}

function saveSettings() {
  const settings = getFormSettings();

  chrome.storage.sync.set(settings, () => {
    console.log("R34 Visual Filter settings saved", settings);
  });
}

function resetSettings() {
  chrome.storage.sync.set(DEFAULT_SETTINGS, () => {
    fillForm(DEFAULT_SETTINGS);
  });
}

function bindLiveLabels() {
  ["brightness", "contrast", "saturation", "grayscale", "blur"].forEach((id) => {
    updateValueLabel(id);
  });
}

function updateValueLabel(id) {
  const el = document.getElementById(id);
  const label = document.getElementById(`${id}Value`);

  if (!el || !label) return;

  label.textContent = el.value;
}