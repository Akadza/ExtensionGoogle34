(() => {
  const namespace = window.R34VF || (window.R34VF = {});

  const HOVER_DELAY_MS = 320;
  const SEEK_INTERVAL_MS = 2200;
  const CACHE_LIMIT = 80;

  const state = {
    enabled: true,
    initialized: false,
    hoverTimerId: null,
    seekTimerId: null,
    activeCard: null,
    activeController: null,
    sourceCache: new Map()
  };

  function init() {
    if (state.initialized) return;

    document.addEventListener("pointerover", handlePointerOver, true);
    document.addEventListener("pointerout", handlePointerOut, true);
    state.initialized = true;
  }

  function setEnabled(enabled) {
    state.enabled = Boolean(enabled);
    if (!state.enabled) stop();
  }

  function handlePointerOver(event) {
    if (!state.enabled || shouldSkipPreview()) return;

    const card = event.target.closest?.(".r34vf-card-video");
    if (!card || card.classList.contains("r34vf-hidden")) return;
    if (card === state.activeCard) return;

    schedulePreview(card);
  }

  function handlePointerOut(event) {
    const card = event.target.closest?.(".r34vf-card-video");
    if (!card) return;

    const nextTarget = event.relatedTarget;
    if (nextTarget && card.contains(nextTarget)) return;

    stop();
  }

  function schedulePreview(card) {
    clearTimers();
    abortActiveRequest();

    state.activeCard = card;
    state.hoverTimerId = window.setTimeout(() => {
      state.hoverTimerId = null;
      startPreview(card);
    }, HOVER_DELAY_MS);
  }

  async function startPreview(card) {
    if (!document.contains(card) || card.classList.contains("r34vf-hidden")) return;

    const meta = namespace.dom.getPostMeta(card);
    if (meta.mediaType !== "video" || !meta.url) return;

    const controller = new AbortController();
    state.activeController = controller;

    try {
      const videoUrl = await resolveVideoUrl(meta.url, controller.signal);
      if (!videoUrl || controller.signal.aborted || state.activeCard !== card) return;

      renderVideo(card, videoUrl);
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.debug("R34VF preview failed", error);
      }
    }
  }

  async function resolveVideoUrl(postUrl, signal) {
    if (state.sourceCache.has(postUrl)) {
      return state.sourceCache.get(postUrl);
    }

    const response = await fetch(postUrl, {
      credentials: "include",
      signal
    });

    if (!response.ok) {
      rememberSource(postUrl, "");
      return "";
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const videoUrl = extractVideoSource(doc, postUrl);

    rememberSource(postUrl, videoUrl);
    return videoUrl;
  }

  function extractVideoSource(doc, baseUrl) {
    const selectors = [
      "video source[src]",
      "video[src]",
      "source[type^='video/'][src]",
      "a[href$='.webm']",
      "a[href$='.mp4']",
      "a[href*='.webm?']",
      "a[href*='.mp4?']"
    ];

    for (const selector of selectors) {
      const node = doc.querySelector(selector);
      const rawUrl = node?.getAttribute("src") || node?.getAttribute("href");
      const absoluteUrl = toAbsoluteUrl(rawUrl, baseUrl);
      if (absoluteUrl) return absoluteUrl;
    }

    const pageText = doc.documentElement.textContent || "";
    const match = pageText.match(/https?:\/\/[^\s"']+\.(?:webm|mp4)(?:\?[^\s"']*)?/i);
    return match?.[0] || "";
  }

  function renderVideo(card, videoUrl) {
    removeVideo(card);

    const video = document.createElement("video");
    video.className = "r34vf-preview-video";
    video.src = videoUrl;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.setAttribute("aria-hidden", "true");

    video.addEventListener("loadedmetadata", () => startSegmentSeeking(video), { once: true });
    video.addEventListener("error", () => removeVideo(card), { once: true });

    card.appendChild(video);
    video.play().catch(() => {});
  }

  function startSegmentSeeking(video) {
    const duration = Number(video.duration);
    if (!Number.isFinite(duration) || duration <= 8) return;

    let cursor = Math.max(0.5, duration * 0.08);
    video.currentTime = Math.min(cursor, duration - 1);

    clearSeekTimer();
    state.seekTimerId = window.setInterval(() => {
      if (!document.contains(video)) {
        clearSeekTimer();
        return;
      }

      cursor += Math.max(2, duration * 0.16);
      if (cursor >= duration - 1) cursor = duration * 0.08;
      video.currentTime = Math.min(cursor, duration - 1);
    }, SEEK_INTERVAL_MS);
  }

  function stop() {
    clearTimers();
    abortActiveRequest();
    clearSeekTimer();

    if (state.activeCard) {
      removeVideo(state.activeCard);
    }

    state.activeCard = null;
  }

  function clearTimers() {
    if (state.hoverTimerId !== null) {
      window.clearTimeout(state.hoverTimerId);
      state.hoverTimerId = null;
    }
  }

  function clearSeekTimer() {
    if (state.seekTimerId !== null) {
      window.clearInterval(state.seekTimerId);
      state.seekTimerId = null;
    }
  }

  function abortActiveRequest() {
    state.activeController?.abort();
    state.activeController = null;
  }

  function removeVideo(card) {
    card?.querySelectorAll?.(".r34vf-preview-video").forEach((video) => video.remove());
  }

  function rememberSource(postUrl, videoUrl) {
    state.sourceCache.set(postUrl, videoUrl);

    if (state.sourceCache.size <= CACHE_LIMIT) return;

    const oldestKey = state.sourceCache.keys().next().value;
    state.sourceCache.delete(oldestKey);
  }

  function toAbsoluteUrl(rawUrl, baseUrl) {
    if (!rawUrl) return "";

    try {
      return new URL(rawUrl, baseUrl).toString();
    } catch (_error) {
      return "";
    }
  }

  function shouldSkipPreview() {
    return Boolean(navigator.connection?.saveData);
  }

  namespace.preview = {
    init,
    setEnabled,
    stop
  };
})();
