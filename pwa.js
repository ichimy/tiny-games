/* Tiny Games for Tiny Humans — PWA bootstrap.
   Registers the service worker so the site installs and runs offline.
   Loaded as a deferred script from every page at any directory depth. */
(function () {
  if (!("serviceWorker" in navigator)) return;

  // Opening index.html straight off the disk (file://) cannot use one.
  if (location.protocol !== "http:" && location.protocol !== "https:") return;

  const script = document.currentScript;
  const swUrl = script ? new URL("sw.js", script.src) : new URL("sw.js", location.href);

  const register = () => {
    navigator.serviceWorker.register(swUrl).catch((error) => {
      console.warn("[pwa] service worker registration failed:", error);
    });
  };

  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
})();
