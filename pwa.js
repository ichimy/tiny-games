/* Tiny Games for Tiny Humans — PWA bootstrap.
   Registers the service worker so the site installs and runs offline.
   Loaded as a deferred script from every page at any directory depth. */
(function () {
  if (!("serviceWorker" in navigator)) return;

  // Opening index.html straight off the disk (file://) cannot use one.
  if (location.protocol !== "http:" && location.protocol !== "https:") return;

  const script = document.currentScript;
  const swUrl = script ? new URL("sw.js", script.src) : new URL("sw.js", location.href);
  const reloadKey = "tiny-games-sw-reload";
  const hadController = Boolean(navigator.serviceWorker.controller);

  if (hadController) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (sessionStorage.getItem(reloadKey) === "1") return;
      sessionStorage.setItem(reloadKey, "1");
      location.reload();
    });
  }

  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register(swUrl, {
        updateViaCache: "none",
      });
      await registration.update();

      const update = () => {
        if (document.visibilityState === "visible") {
          registration.update().catch(() => {});
        }
      };
      window.addEventListener("focus", update);
      document.addEventListener("visibilitychange", update);
      window.setInterval(update, 60_000);
    } catch (error) {
      console.warn("[pwa] service worker registration failed:", error);
    }
  };

  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
})();
