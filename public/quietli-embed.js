(function () {
  function getScriptOrigin() {
    var scripts = document.getElementsByTagName("script");

    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src;

      if (src && src.indexOf("/quietli-embed.js") !== -1) {
        try {
          return new URL(src).origin;
        } catch (error) {
          return "https://www.quietli.io";
        }
      }
    }

    return "https://www.quietli.io";
  }

  var quietliOrigin = getScriptOrigin();

  function makeEmbedId() {
    return "quietli_" + Math.random().toString(36).slice(2) + Date.now();
  }

  function getDefaultHeight(variant, size) {
    if (variant === "feed") {
      if (size === "compact") return 300;
      if (size === "large") return 600;
      return 420;
    }

    if (size === "compact") return 100;
    if (size === "large") return 180;
    return 140;
  }

  function buildEmbed(element) {
    if (!element || element.dataset.quietliReady === "true") return;

    var username = element.getAttribute("data-quietli-embed");
    if (!username) return;

    var variant = element.getAttribute("data-variant") || "latest";
    var size = element.getAttribute("data-size") || "standard";
    var height = element.getAttribute("data-height");
    var embedId = makeEmbedId();

    var initialHeight = height
      ? parseInt(height, 10)
      : getDefaultHeight(variant, size);

    if (!initialHeight || initialHeight < 80) {
      initialHeight = getDefaultHeight(variant, size);
    }

    var iframe = document.createElement("iframe");

    iframe.src =
      quietliOrigin +
      "/embed/" +
      encodeURIComponent(username) +
      "?variant=" +
      encodeURIComponent(variant) +
      "&size=" +
      encodeURIComponent(size) +
      "&quietliEmbedId=" +
      encodeURIComponent(embedId);

    if (variant === "feed") {
      iframe.src += "&height=" + encodeURIComponent(initialHeight);
    }

    iframe.width = "100%";
    iframe.height = String(initialHeight);
    iframe.title = "Quietli " + (variant === "feed" ? "blip feed" : "latest blip");
    iframe.loading = "lazy";
    iframe.scrolling = variant === "feed" ? "yes" : "no";

    iframe.setAttribute("data-quietli-iframe-id", embedId);
    iframe.setAttribute("allowtransparency", "true");

    iframe.style.display = "block";
    iframe.style.width = "100%";
    iframe.style.maxWidth = "100%";
    iframe.style.border = "0";
    iframe.style.overflow = "hidden";
    iframe.style.borderRadius = element.getAttribute("data-radius") || "24px";
    iframe.style.background = "transparent";

    element.innerHTML = "";
    element.appendChild(iframe);
    element.dataset.quietliReady = "true";
    element.dataset.quietliIframeId = embedId;
  }

  function initQuietliEmbeds() {
    var embeds = document.querySelectorAll("[data-quietli-embed]");

    for (var i = 0; i < embeds.length; i++) {
      buildEmbed(embeds[i]);
    }
  }

  window.addEventListener("message", function (event) {
    if (!event || !event.data) return;

    var data = event.data;

    if (data.type !== "QUIETLI_EMBED_RESIZE") return;
    if (!data.id || !data.height) return;

    var iframe = document.querySelector(
      'iframe[data-quietli-iframe-id="' + data.id + '"]'
    );

    if (!iframe) return;

    var nextHeight = parseInt(data.height, 10);

    if (!nextHeight || nextHeight < 80) return;

    iframe.style.height = nextHeight + "px";
    iframe.height = String(nextHeight);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initQuietliEmbeds);
  } else {
    initQuietliEmbeds();
  }

  window.QuietliEmbeds = {
    init: initQuietliEmbeds,
  };
})();