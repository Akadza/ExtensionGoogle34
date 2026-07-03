(() => {
  const namespace = window.R34VF || (window.R34VF = {});

  const SHELL_ID = "r34vf-shell";
  const CONTROL_SELECTOR = "[data-r34vf-setting]";

  const state = {
    settings: null,
    onChange: null,
    saveTimerId: null,
    tagQuery: ""
  };

  function mount(settings, onChange) {
    state.settings = settings;
    state.onChange = onChange;

    if (!settings.showShell) {
      unmount();
      return;
    }

    const shell = ensureShell();
    syncControls(shell, settings);
    renderSelectedTags(shell, settings.selectedTags);
    renderTagSuggestions(shell, state.tagQuery);
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
              <input type="checkbox" data-r34vf-setting="filterEnabled">
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

          <label class="r34vf-check">
            <input type="checkbox" data-r34vf-setting="previewEnabled">
            <span>Hover video preview</span>
          </label>
        </section>

        <section class="r34vf-panel">
          <h2>Tags</h2>
          <label class="r34vf-field">
            <span>Include tags</span>
            <input type="search" data-r34vf-action="tag-search" placeholder="type tag name" autocomplete="off">
          </label>
          <div class="r34vf-tag-suggestions" data-r34vf-tag-suggestions></div>
          <div class="r34vf-tag-chips" data-r34vf-selected-tags></div>

          <label class="r34vf-field r34vf-field-spaced">
            <span>Blacklist tags</span>
            <textarea data-r34vf-setting="blacklistTags" placeholder="tag_one&#10;tag_two&#10;prefix_*"></textarea>
          </label>
        </section>

        <section class="r34vf-panel">
          <h2>Advanced filters</h2>
          <label class="r34vf-field">
            <span>Min score</span>
            <input type="number" data-r34vf-setting="minScore" placeholder="10">
          </label>
          <label class="r34vf-field r34vf-disabled-field" title="Works only when this metadata is available in loaded cards or fetched metadata.">
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
          <p class="r34vf-help">Date/views filters need metadata from loaded cards or a later metadata-fetch layer.</p>
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

  function bindShell(shell) {
    shell.addEventListener("input", handleInput);
    shell.addEventListener("change", handleControlChange);
    shell.addEventListener("click", handleClick);
  }

  function handleInput(event) {
    const tagInput = event.target.closest("[data-r34vf-action='tag-search']");
    if (tagInput) {
      state.tagQuery = tagInput.value;
      renderTagSuggestions(document.getElementById(SHELL_ID), state.tagQuery);
      return;
    }

    handleControlChange(event);
  }

  function handleClick(event) {
    const toggleButton = event.target.closest("[data-r34vf-action='toggle-sidebar']");
    if (toggleButton) {
      event.preventDefault();
      updateSetting("sidebarCollapsed", !state.settings.sidebarCollapsed);
      return;
    }

    const segmentButton = event.target.closest("[data-r34vf-segment]");
    if (segmentButton) {
      event.preventDefault();
      updateSetting(segmentButton.dataset.r34vfSegment, segmentButton.dataset.r34vfValue);
      return;
    }

    const suggestionButton = event.target.closest("[data-r34vf-add-tag]");
    if (suggestionButton) {
      event.preventDefault();
      addSelectedTag(suggestionButton.dataset.r34vfAddTag);
      return;
    }

    const removeButton = event.target.closest("[data-r34vf-remove-tag]");
    if (removeButton) {
      event.preventDefault();
      removeSelectedTag(removeButton.dataset.r34vfRemoveTag);
    }
  }

  function handleControlChange(event) {
    const control = event.target.closest(CONTROL_SELECTOR);
    if (!control) return;

    const key = control.dataset.r34vfSetting;
    const value = readControlValue(control);
    updateSetting(key, value);
  }

  function addSelectedTag(tag) {
    const selectedTags = namespace.settings.normalizeTagList([...state.settings.selectedTags, tag]);
    updateSetting("selectedTags", selectedTags);
    focusTagInput();
  }

  function removeSelectedTag(tag) {
    const selectedTags = state.settings.selectedTags.filter((item) => item !== tag);
    updateSetting("selectedTags", selectedTags);
    focusTagInput();
  }

  function focusTagInput() {
    const input = document.querySelector("[data-r34vf-action='tag-search']");
    input?.focus();
  }

  function updateSetting(key, value) {
    const nextSettings = namespace.settings.normalizeSettings({ ...state.settings, [key]: value });

    state.settings = nextSettings;
    const shell = document.getElementById(SHELL_ID);
    syncControls(shell, nextSettings);
    renderSelectedTags(shell, nextSettings.selectedTags);
    renderTagSuggestions(shell, state.tagQuery);

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
    shell.classList.toggle("r34vf-filters-off", !settings.filterEnabled);

    shell.querySelectorAll(CONTROL_SELECTOR).forEach((control) => {
      const key = control.dataset.r34vfSetting;
      const value = settings[key];

      if (control.type === "checkbox") {
        control.checked = Boolean(value);
      } else {
        control.value = value ?? "";
      }
    });

    const tagInput = shell.querySelector("[data-r34vf-action='tag-search']");
    if (tagInput && document.activeElement !== tagInput) {
      tagInput.value = state.tagQuery;
    }

    shell.querySelectorAll("[data-r34vf-segment]").forEach((button) => {
      const key = button.dataset.r34vfSegment;
      button.classList.toggle("is-active", settings[key] === button.dataset.r34vfValue);
    });
  }

  function renderSelectedTags(shell, selectedTags) {
    const target = shell?.querySelector("[data-r34vf-selected-tags]");
    if (!target) return;

    if (!selectedTags.length) {
      target.innerHTML = `<span class="r34vf-empty">No selected tags</span>`;
      return;
    }

    target.innerHTML = selectedTags.map((tag) => `
      <button type="button" class="r34vf-chip" data-r34vf-remove-tag="${escapeAttribute(tag)}" title="Remove ${escapeAttribute(tag)}">
        ${escapeHtml(tag)} <span aria-hidden="true">×</span>
      </button>
    `).join("");
  }

  function renderTagSuggestions(shell, query) {
    const target = shell?.querySelector("[data-r34vf-tag-suggestions]");
    if (!target) return;

    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      target.innerHTML = `<span class="r34vf-empty">Start typing to search tags</span>`;
      return;
    }

    const suggestions = namespace.dom.collectAvailableTags(normalizedQuery)
      .filter((tag) => !state.settings.selectedTags.includes(tag))
      .slice(0, 12);

    if (!suggestions.length) {
      target.innerHTML = `<span class="r34vf-empty">No matches</span>`;
      return;
    }

    target.innerHTML = suggestions.map((tag) => `
      <button type="button" class="r34vf-suggestion" data-r34vf-add-tag="${escapeAttribute(tag)}">${escapeHtml(tag)}</button>
    `).join("");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  namespace.ui = { mount, unmount };
})();
