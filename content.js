(function () {
  const videoElement = document.getElementById("song-video");
  if (!videoElement) return;

  const innerVideo = videoElement.querySelector("video");

  function blockVideo(video) {
    if (!video) return;

    // Clear existing sources
    video.removeAttribute("src");
    while (video.firstChild) {
      video.removeChild(video.firstChild);
    }

    // Override functions
    video.load = () => {};
    video.play = () => {};
    video.style.display = "none";
  }

  blockVideo(innerVideo);

  // Watch for new <source> or src being added
  const videoObserver = new MutationObserver(() => blockVideo(innerVideo));
  videoObserver.observe(innerVideo, { childList: true, attributes: true, subtree: true });

  // Try max resolution, fall back if unavailable
  function toBestRes(url) {
    if (!url) return "";
    return url.replace(/(default|hqdefault|mqdefault|sddefault|maxresdefault)\.jpg.*$/, "maxresdefault.jpg");
  }

  function createOverlay(parent) {
    const overlay = document.createElement("div");
    overlay.id = "thumb-overlay";
    Object.assign(overlay.style, {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundSize: "cover",
      backgroundPosition: "center",
      pointerEvents: "none", // do not block controls
    });
    parent.appendChild(overlay);
    return overlay;
  }

  function updateOverlay() {
    try {
      const mainImg = document.querySelector("ytmusic-player-bar img.image");
      if (!mainImg?.src) return;

      const overlay =
        document.getElementById("thumb-overlay") || createOverlay(videoElement.parentNode);

      const testImg = new Image();
      testImg.onload = () => {
        if (testImg.naturalWidth > 0) {
          overlay.style.backgroundImage = `url('${toBestRes(mainImg.src)}')`;
        } else {
          overlay.style.backgroundImage = `url('${mainImg.src}')`; // fallback
        }
      };
      testImg.src = toBestRes(mainImg.src);
    } catch (e) {
      console.warn("Overlay update failed:", e);
    }
  }

  // Debounce to prevent spam calls from MutationObserver
  let debounceTimer;
  function debouncedUpdate() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateOverlay, 200);
  }

  updateOverlay();

  const player = document.querySelector("ytmusic-player");
  if (player) {
    const playerObserver = new MutationObserver(debouncedUpdate);
    playerObserver.observe(player, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    // Clean up if player is removed
    window.addEventListener("unload", () => {
      playerObserver.disconnect();
      videoObserver.disconnect();
    });
  }
})();
