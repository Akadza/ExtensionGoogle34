(() => {
  const namespace = window.R34VF || (window.R34VF = {});

  const SHELL_ID = "r34vf-shell";
  const CONTROL_SELECTOR = "[data-r34vf-setting]";

  const state = {
    settings: null,
    onChange: null,
    saveTimerId: null
  };

  function mount(settings, onChange) {
    state.settings = settings;
    state.onChange = onChange;

    if (!settings.enabled || !settings.showShell) {
      unmount();
      return;
    }

    const shell = ensureShell();
    syncControls(shell, settings);
  }

  function unmount() {
    document.getElementById(SHELL_ID)?.remove();
  }

  function ensureShell() {
    let shell = document.getElementById(SHELL_ID);
    if (shell) return shell;

    shell = document.createElement("div");
    shell.id = SHELL_ID;
    shell.innerHTML = createShellTemplate();
    document.body.appendChild(shell);
    bindShell(shell);

    return shell;
  }

  function createShellTemplate() {
    return `
      <div class="r34vf-topbar">
        <div class="r34vf-brand">
          <button class="r34vf-icon-button" type="button" data-r34vf-action="toggle-sidebar" aria-label="Toggle sidebar">☰</button>
          <div>
            <strong>Rule 34 Visual</strong>
            <span>local layout and filters</span>
          </div>
        </div>

        <div class="r34vf-top-controls" role="group" aria-label="Quick filters">
          ${createSegmentedControl("mediaType", [
            ["all", "All"],
            ["image", "Images"],
            ["video", "Videos"]
          ])}
          ${createSegmentedControl("layoutMode", [
            ["masonry", "Masonry"],
            ["grid", "Grid"]
          ])}
        </div>
      </div>

      <aside class="r34vf-sidebar" aria-label="Filters and settings">
        <section class="r34vf-panel">
          <div class="r34vf-panel-title">
            <h2>Filters</h2>
            <label class="r34vf-switch">
              <input type="checkbox" data-r34vf-setting="enabled">
              <span></span>
            </label>
          </div>

          <label class="r34vf-field">
            <span>Media type</span>
            <select data-r34vf-setting="mediaType">
              <option value="all">All posts</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
            </select>
          </label>

          <label class="r34vf-field">
            <span>Layout</span>
            <select data-r34vf-setting="layoutMode">
              <option value="masonry">Pinterest masonry</option>
              <option value="grid">Uniform grid</option>
            </select>
          </label>

          <div class="r34vf-row">
            <label class="r34vf-check">
              <input type="checkbox" data-r34vf-setting="previewEnabled">
              <span>Hover video preview</span>
            </label>
          </div>
        </section>

        <section class="r34vf-panel">
          <h2>Image tuning</h2>
          ${createRange("brightness", "Brightness", 0.3, 1.8, 0.05)}
          ${createRange("contrast", "Contrast", 0.3, 2, 0.05)}
          ${createRange("saturation", "Saturation", 0, 2, 0.05)}
          ${createRange("grayscale", "Grayscale", 0, 1, 0.05)}
          ${createRange("blur", "Blur", 0, 20, 1)}
          <label class="r34vf-check">
            <input type="checkbox" data-r34vf-setting="hoverUnblur">
            <span>Remove blur on hover</span>
          </label>
        </section>

        <section class="r34vf-panel">
          <h2>Advanced filters</h2>
          <label class="r34vf-field">
            <span>Min score</span>
            <input type="number" data-r34vf-setting="minScore" placeholder="10">
          </label>
          <label class="r34vf-field r34vf-disabled-field" title="Works only when this metadata is available in the loaded cards or fetched data.">
            <span>Min views <em>prepared</em></span>
            <input type="number" data-r34vf-setting="minViews" placeholder="not always available">
          </label>
          <label class="r34vf-field r34vf-disabled-field" title="Needs post dates in DOM or a metadata fetch layer.">
            <span>Date period <em>prepared</em></span>
            <select data-r34vf-setting="datePeriod">
              <option value="any">Any time</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
            </select>
          </label>
          <label class="r34vf-field">
            <span>Blacklist tags</span>
            <textarea data-r34vf-setting="blacklistTags" placeholder="tag_one&#10;tag_two&#10;prefix_*"></textarea>
          </label>
        </section>
      </aside>
    `;
  }

  function createSegmentedControl(settingName, items) {
    const buttons = items.map(([value, label]) => `
      <button type="button" data-r34vf-segment="${settingName}" data-r34vf-value="${value}">${label}</button>
    `).join("");

    return `<div class="r34vf-segmented" data-r34vf-segment-group="${settingName}">${buttons}</div>`;
  }

  function createRange(id, label, min, max, step) {
    return `
      <label class="r34vf-range">
        <span>${label} <output data-r34vf-output="${id}"></output></span>
        <input type="range" min="${min}" max="${max}" step="${step}" data-r34vf-setting="${id}">
      </label>
    `;
  }

  function bindShell(shell) {
    shell.addEventListener("input", handleControlChange);
    shell.addEventListener("change", handleControlChange);
    shell.addEventListener("click", handleClick);
  }

  function handleClick(event) {
    const toggleButton = event.target.closest("[data-r34vf-action='toggle-sidebar']");
    if (toggleButton) {
      updateSetting("sidebarCollapsed", !state.settings.sidebarCollapsed);
      return;
    }

    const segmentButton = event.target.closest("[data-r34vf-segment]");
    if (segmentButton) {
      updateSetting(segmentButton.dataset.r34vfSegment, segmentButton.dataset.r34vfValue);
    }
  }

  function handleControlChange(event) {
    const control = event.target.closest(CONTROL_SELECTOR);
    if (!control) return;

    const key = control.dataset.r34vfSetting;
    const value = readControlValue(control);
    updateSetting(key, value);
  }

  function updateSetting(key, value) {
    const nextSettings = namespace.settings.normalizeSettings({
      ...state.settings,
      [key]: value
    });

    state.settings = nextSettings;
    syncControls(document.getElementById(SHELL_ID), nextSettings);

    if (typeof state.onChange === "function") {
      state.onChange(nextSettings);
    }

    scheduleSave(nextSettings);
  }

  function scheduleSave(settings) {
    if (state.saveTimerId !== null) {
      window.clearTimeout(state.saveTimerId);
    }

    state.saveTimerId = window.setTimeout(() => {
      namespace.settings.saveSettings(settings);
      state.saveTimerId = null;
    }, 120);
  }

  function readControlValue(control) {
    if (control.type === "checkbox") return control.checked;
    if (control.type === "range") return Number(control.value);
    return control.value;
  }

  function syncControls(shell, settings) {
    if (!shell) return;

    shell.classList.toggle("r34vf-sidebar-collapsed", settings.sidebarCollapsed);

    shell.querySelectorAll(CONTROL_SELECTOR).forEach((control) => {
      const key = control.dataset.r34vfSetting;
      const value = settings[key];

      if (control.type === "checkbox") {
        control.checked = Boolean(value);
      } else {
        control.value = value ?? "";
      }
    });

    shell.querySelectorAll("[data-r34vf-output]").forEach((output) => {
      const key = output.dataset.r34vfOutput;
      output.textContent = String(settings[key] ?? "");
    });

    shell.querySelectorAll("[data-r34vf-segment]").forEach((button) => {
      const key = button.dataset.r34vfSegment;
      button.classList.toggle("is-active", settings[key] === button.dataset.r34vfValue);
    });
  }

  namespace.ui = {
    mount,
    unmount
  };
})();
