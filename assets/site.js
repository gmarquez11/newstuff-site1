/* QR Tiles — newstuff.app shared behavior: the visitor's accent and the header's color picker. */
(function () {
  "use strict";

  var doc = document.documentElement;
  var KEY = "qrt-accent";
  var ACCENTS = ["clay", "ink", "ocean", "sage", "honey", "plum"];
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function store(name) {
    try { localStorage.setItem(KEY, name); } catch (e) { /* private mode: session-only */ }
  }

  /* The screens follow the accent: clay's pictures sit at /assets/screens/<file>, every other
     accent's in /assets/screens/<accent>/<file>, so one rule maps any picture path to any accent. */
  function screenPath(name, path) {
    var m = path.match(/^(.*\/assets\/screens\/)(?:(?:clay|ink|ocean|sage|honey|plum)\/)?([^\/]+)$/);
    if (!m) return path;
    return m[1] + (name === "clay" ? "" : name + "/") + m[2];
  }
  function swapScreens(name) {
    var parts = document.querySelectorAll("picture img.shot, picture source");
    for (var i = 0; i < parts.length; i++) {
      var attr = parts[i].tagName === "SOURCE" ? "srcset" : "src";
      var now = parts[i].getAttribute(attr);
      if (!now) continue;
      var next = screenPath(name, now);
      if (next !== now) parts[i].setAttribute(attr, next);
    }
  }

  /* Apply an accent everywhere: <html data-accent>, every swatch's pressed state, every screen. */
  function applyAccent(name, animate) {
    if (ACCENTS.indexOf(name) === -1) name = "clay";
    if (animate && !reduceMotion.matches) {
      doc.classList.add("re-theme");
      clearTimeout(applyAccent._t);
      applyAccent._t = setTimeout(function () { doc.classList.remove("re-theme"); }, 450);
    }
    doc.dataset.accent = name;
    var sws = document.querySelectorAll(".sw[data-c]");
    for (var i = 0; i < sws.length; i++) {
      sws[i].setAttribute("aria-pressed", sws[i].dataset.c === name ? "true" : "false");
    }
    swapScreens(name);
  }

  function wireSwatches() {
    document.addEventListener("click", function (ev) {
      var sw = ev.target.closest ? ev.target.closest(".sw[data-c]") : null;
      if (!sw) return;
      store(sw.dataset.c);
      applyAccent(sw.dataset.c, true);
    });
  }

  /* The header's discreet color picker. */
  function wireHeader() {
    var hdr = document.querySelector(".hdr");
    if (!hdr) return;
    var toggle = function () {
      hdr.classList.toggle("on", window.scrollY > Math.min(window.innerHeight * 0.55, 480));
    };
    window.addEventListener("scroll", toggle, { passive: true });
    toggle();
    var pick = hdr.querySelector(".hdr-pick");
    if (!pick) return;
    var btn = pick.querySelector(".hdr-dot");
    btn.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var open = pick.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function (ev) {
      if (!pick.contains(ev.target)) { pick.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { pick.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
    });
  }

  applyAccent(stored() || "clay", false);
  document.addEventListener("DOMContentLoaded", function () {
    swapScreens(doc.dataset.accent);
    wireSwatches();
    wireHeader();
  });
})();
