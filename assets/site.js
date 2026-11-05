/* QR Tiles — newstuff.app shared behavior: the visitor's accent, which the screens and the app icons follow, the header's color picker and its language link. */
(function () {
  "use strict";

  var doc = document.documentElement;
  var KEY = "qrt-accent";
  var LANG = "qrt-lang";
  var ACCENTS = ["clay", "ink", "ocean", "sage", "honey", "plum"];
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function store(name) {
    try { localStorage.setItem(KEY, name); } catch (e) { /* private mode: session-only */ }
  }
  function storeLang(code) {
    try { localStorage.setItem(LANG, code); } catch (e) { /* storage refused: the head script's probe fails too, so no page redirects */ }
  }

  /* The screens follow the accent: clay's pictures sit at /assets/screens/<file>, every other
     accent's in /assets/screens/<accent>/<file>, and a Spanish page's under /assets/screens/es/ the
     same way, so one rule maps any picture path to any accent and keeps its language. */
  function screenPath(name, path) {
    var m = path.match(/^(.*\/assets\/screens\/)(es\/)?(?:(?:clay|ink|ocean|sage|honey|plum)\/)?([^\/]+)$/);
    if (!m) return path;
    return m[1] + (m[2] || "") + (name === "clay" ? "" : name + "/") + m[3];
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

  /* The marks and the tab's icons follow the accent the same way: clay's are the defaults at
     /assets/app-icon.png, /assets/app-icon-dark.png, /favicon.png and /apple-touch-icon.png, every
     other accent's sit in /assets/icons/<accent>/ under the same names. Each swatch keeps its own icon. */
  function iconPath(name, path) {
    var m = path.match(/^(.*?)\/(?:assets\/icons\/(?:clay|ink|ocean|sage|honey|plum)\/|assets\/)?(app-icon(?:-dark)?\.png|favicon\.png|apple-touch-icon\.png)$/);
    if (!m) return path;
    if (name !== "clay") return m[1] + "/assets/icons/" + name + "/" + m[2];
    return m[1] + (m[2].indexOf("app-icon") === 0 ? "/assets/" : "/") + m[2];
  }
  function swapIcons(name) {
    var parts = document.querySelectorAll("picture.mark-pic img, picture.mark-pic source, link[rel='icon'], link[rel='apple-touch-icon']");
    for (var i = 0; i < parts.length; i++) {
      var attr = parts[i].tagName === "SOURCE" ? "srcset" : parts[i].tagName === "LINK" ? "href" : "src";
      var now = parts[i].getAttribute(attr);
      if (!now) continue;
      var next = iconPath(name, now);
      if (next !== now) parts[i].setAttribute(attr, next);
    }
  }

  /* Apply an accent everywhere: <html data-accent>, every swatch's pressed state, every screen, every mark and the tab's icons. */
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
    swapIcons(name);
  }

  function wireSwatches() {
    document.addEventListener("click", function (ev) {
      var sw = ev.target.closest ? ev.target.closest(".sw[data-c]") : null;
      if (!sw) return;
      store(sw.dataset.c);
      applyAccent(sw.dataset.c, true);
    });
  }

  /* Any link marked data-lang (the header's language link, a legal page's link to its English text):
     following it remembers that language the way the accent is remembered, and every English page's
     head script reads the choice before it sends anyone to Spanish. */
  function wireLanguage() {
    var remember = function (ev) {
      var a = ev.target.closest ? ev.target.closest("a[data-lang]") : null;
      if (a) storeLang(a.dataset.lang);
    };
    document.addEventListener("click", remember);
    document.addEventListener("auxclick", function (ev) { if (ev.button === 1) remember(ev); });
  }

  /* The header's discreet color picker. */
  function wireHeader() {
    var hdr = document.querySelector(".hdr");
    if (!hdr) return;
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
    swapIcons(doc.dataset.accent);
    wireSwatches();
    wireHeader();
    wireLanguage();
  });
})();
