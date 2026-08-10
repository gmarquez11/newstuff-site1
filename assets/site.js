/* QR Tiles — newstuff.app shared behavior. Section scripts append below the marker at EOF. */
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

  /* Apply an accent everywhere: <html data-accent> + every swatch's pressed state. */
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
  }

  /* Wire every swatch on the page (gate, header popover, personalize, footer). */
  function wireSwatches() {
    document.addEventListener("click", function (ev) {
      var sw = ev.target.closest ? ev.target.closest(".sw[data-c]") : null;
      if (!sw) return;
      var name = sw.dataset.c;
      store(name);
      if (doc.classList.contains("gate-on") && sw.closest("#gate")) {
        leaveGate(sw);
      } else {
        applyAccent(name, true);
      }
    });
  }

  /* ----- the gate (first visit only) ----- */

  function leaveGate(sw) {
    applyAccent(sw.dataset.c, false);
    sw.classList.add("picked");
    var delay = reduceMotion.matches ? 0 : 420;
    setTimeout(function () {
      doc.classList.add("gate-leaving");
      doc.classList.remove("gate-on");
      var gate = document.getElementById("gate");
      var done = function () {
        if (gate && gate.parentNode) gate.parentNode.removeChild(gate);
        doc.classList.remove("gate-leaving");
      };
      if (reduceMotion.matches) done();
      else setTimeout(done, 900);
      startReveals();
      headerWatch(true);
    }, delay);
  }

  function initGate() {
    var gate = document.getElementById("gate");
    if (!gate) return;
    if (!doc.classList.contains("gate-on")) {
      if (gate.parentNode) gate.parentNode.removeChild(gate);
      return;
    }
    var skip = gate.querySelector(".gate-skip");
    if (skip) {
      skip.addEventListener("click", function () {
        store("clay");
        var clay = gate.querySelector('.sw[data-c="clay"]');
        leaveGate(clay || { dataset: { c: "clay" }, classList: { add: function () {} } });
      });
    }
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && doc.classList.contains("gate-on") && skip) skip.click();
    });
    var first = gate.querySelector(".sw");
    if (first) first.focus({ preventScroll: true });
  }

  /* ----- reveal on scroll ----- */

  var revealsStarted = false;
  function startReveals() {
    if (revealsStarted) return;
    revealsStarted = true;
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || reduceMotion.matches) {
      for (var i = 0; i < els.length; i++) els[i].classList.add("in");
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    for (var j = 0; j < els.length; j++) io.observe(els[j]);
  }

  /* ----- header: appears after the hero; holds the discreet color edit ----- */

  function headerWatch(force) {
    var hdr = document.querySelector(".hdr");
    if (!hdr) return;
    var toggle = function () {
      var on = window.scrollY > Math.min(window.innerHeight * 0.55, 480);
      hdr.classList.toggle("on", on);
    };
    if (!headerWatch._wired) {
      headerWatch._wired = true;
      window.addEventListener("scroll", toggle, { passive: true });
      var pick = hdr.querySelector(".hdr-pick");
      if (pick) {
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
    }
    if (force) toggle();
  }

  /* ----- pause looping animations while offscreen ----- */

  function pauseOffscreen() {
    if (!("IntersectionObserver" in window)) return;
    var els = document.querySelectorAll(".hero-float, .how-beam, .share-stage");
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        en.target.classList.toggle("anim-off", !en.isIntersecting);
      });
    }, { rootMargin: "80px 0px" });
    for (var i = 0; i < els.length; i++) io.observe(els[i]);
  }

  /* ----- boot ----- */

  applyAccent(stored() || "clay", false);
  document.addEventListener("DOMContentLoaded", function () {
    wireSwatches();
    initGate();
    headerWatch(true);
    pauseOffscreen();
    if (!doc.classList.contains("gate-on")) startReveals();
  });

  /* Section scripts can listen for accent changes via this observer-free hook. */
  window.qrt = { applyAccent: applyAccent, reduceMotion: reduceMotion };
})();

/* ================= section scripts append below ================= */


/* ===== hero ===== */
(function () { "use strict";
  var sec = document.getElementById("hero");
  if (!sec) return;
  var root = document.documentElement;
  var tiles = sec.querySelectorAll(".hero-it");
  function sync() {
    var a = root.dataset.accent || "clay";
    for (var i = 0; i < tiles.length; i++) {
      tiles[i].classList.toggle("cur", tiles[i].getAttribute("data-c") === a);
    }
  }
  sync();
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ["data-accent"] });
})();


/* ===== scan ===== */
(function () { "use strict";
  var sec = document.getElementById("scan");
  if (!sec) return;
  var cam = sec.querySelector(".scan-cam");
  if (!cam) return;
  var rm = (window.qrt && window.qrt.reduceMotion) ||
           (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)"));
  var sync = function () { cam.classList.toggle("scan-still", !!(rm && rm.matches)); };
  sync();
  if (rm) {
    if (rm.addEventListener) { rm.addEventListener("change", sync); }
    else if (rm.addListener) { rm.addListener(sync); }
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        cam.classList.toggle("scan-off", !entries[i].isIntersecting);
      }
    }, { rootMargin: "120px 0px" });
    io.observe(cam);
  }
})();


/* ===== tiles ===== */
(function () { "use strict";
  var root = document.getElementById("tiles");
  if (!root) return;
  var runway = root.querySelector(".tls-runway");
  if (!runway) return;

  var mqWide = window.matchMedia("(min-width: 821px)");
  var reduce = (window.qrt && window.qrt.reduceMotion) ||
               window.matchMedia("(prefers-reduced-motion: reduce)");
  var live = false, ticking = false, lastStage = "0", lastP = -1;

  /* chip flips at the midpoint of each CSS crossfade window */
  var THRESH = [0.22, 0.48, 0.69, 0.89];

  /* static autoplay (phones): pinch beat, then List, then Labels */
  var STOPS = [[0.63, "2"], [0.78, "3"], [0.97, "4"]];
  var autoTimer = null, autoIdx = 0, autoIO = null;

  function setStop(i) {
    autoIdx = i;
    root.style.setProperty("--tls-p", String(STOPS[i][0]));
    root.setAttribute("data-tstage", STOPS[i][1]);
  }
  function startAuto() {
    if (autoTimer || live || reduce.matches) return;
    root.classList.add("tls-auto");
    autoTimer = setInterval(function () { setStop((autoIdx + 1) % STOPS.length); }, 2400);
  }
  function stopAuto(keepClass) {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    if (!keepClass) root.classList.remove("tls-auto");
  }
  function armAutoObserver() {
    if (autoIO || !("IntersectionObserver" in window)) return;
    autoIO = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) startAuto();
        else stopAuto(true);
      }
    }, { rootMargin: "-12% 0px" });
    autoIO.observe(runway);
  }

  function autoCheck() {
    if (live || reduce.matches) return;
    var vh = window.innerHeight || 1;
    var r = runway.getBoundingClientRect();
    if (r.bottom > vh * 0.12 && r.top < vh * 0.88) startAuto();
    else stopAuto(true);
  }

  function update() {
    ticking = false;
    if (!live) { autoCheck(); return; }
    var vh = window.innerHeight || 1;
    var rect = runway.getBoundingClientRect();
    var total = rect.height - vh;
    if (total <= 0) return;
    if (rect.bottom < -80 || rect.top > vh + 80) return;
    var p = -rect.top / total;
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    if (Math.abs(p - lastP) > 0.0005) {
      lastP = p;
      root.style.setProperty("--tls-p", p.toFixed(4));
    }
    var s = 0;
    for (var i = 0; i < THRESH.length; i++) if (p >= THRESH[i]) s = i + 1;
    var stage = String(s);
    if (stage !== lastStage) {
      lastStage = stage;
      root.setAttribute("data-tstage", stage);
    }
  }

  function schedule() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }

  function decide() {
    var want = mqWide.matches && !reduce.matches;
    if (want === live) {
      if (live) { schedule(); }
      else if (reduce.matches) { stopAuto(); setStop(0); }
      return;
    }
    live = want;
    root.classList.toggle("tls-live", live);
    if (!live) {
      lastStage = ""; lastP = -1;
      setStop(0);
      if (reduce.matches) { stopAuto(); }
    } else {
      stopAuto();
      schedule();
    }
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  if (mqWide.addEventListener) {
    mqWide.addEventListener("change", decide);
    reduce.addEventListener("change", decide);
  } else if (mqWide.addListener) {
    mqWide.addListener(decide);
    reduce.addListener(decide);
  }
  decide();
  armAutoObserver();
  autoCheck();
})();


/* ===== ask ===== */
(function () { "use strict";
  var root = document.getElementById("ask");
  if (!root) return;
  var stage = root.querySelector(".ask-stage");
  var typed = root.querySelector(".ask-typed");
  if (!stage || !typed) return;
  var mq = (window.qrt && window.qrt.reduceMotion) || window.matchMedia("(prefers-reduced-motion: reduce)");
  var text = typed.textContent;
  var chars = null, timers = [], running = false, inView = false;

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { while (timers.length) clearTimeout(timers.pop()); }

  function build() {
    if (chars) return;
    typed.textContent = "";
    chars = [];
    for (var i = 0; i < text.length; i++) {
      var s = document.createElement("span");
      s.className = "ask-ch";
      s.textContent = text.charAt(i);
      typed.appendChild(s);
      chars.push(s);
    }
  }

  function setChars(n) {
    for (var i = 0; i < chars.length; i++) {
      chars[i].classList.toggle("on", i < n);
      chars[i].classList.toggle("cur", i === n - 1);
    }
  }

  /* stop = back to the composed, static full exchange */
  function stop() {
    clearTimers();
    running = false;
    stage.classList.remove("ask-anim", "ask-cut", "ask-empty", "ask-think", "ask-has-ans");
    if (chars) { typed.textContent = text; chars = null; }
  }

  function cycle() {
    if (!running) return;
    stage.classList.remove("ask-think", "ask-has-ans");
    stage.classList.add("ask-empty");
    setChars(0);
    later(function () {
      if (!running) return;
      stage.classList.remove("ask-empty");
      var i = 0;
      (function tick() {
        if (!running) return;
        i++;
        setChars(i);
        if (i < chars.length) { later(tick, 42 + Math.random() * 46); return; }
        later(function () {
          if (!running) return;
          setChars(chars.length);
          chars[chars.length - 1].classList.remove("cur");
          stage.classList.add("ask-think");
          later(function () {
            if (!running) return;
            stage.classList.remove("ask-think");
            stage.classList.add("ask-has-ans");
            later(cycle, 3600);
          }, 950);
        }, 420);
      })();
    }, 1050);
  }

  function start() {
    if (running || mq.matches) return;
    build();
    running = true;
    stage.classList.add("ask-cut", "ask-anim");
    cycle();
    void stage.offsetWidth;
    later(function () { stage.classList.remove("ask-cut"); }, 60);
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        inView = entries[i].isIntersecting;
        if (inView) { start(); } else { stop(); }
      }
    }, { threshold: 0.3 });
    io.observe(stage);
  } else {
    inView = true;
    start();
  }

  function onMq() { if (mq.matches) { stop(); } else if (inView) { start(); } }
  if (mq.addEventListener) { mq.addEventListener("change", onMq); }
  else if (mq.addListener) { mq.addListener(onMq); }
})();


/* ===== print ===== */
(function () { "use strict";
  var root = document.getElementById("print");
  if (!root) return;
  var label = root.querySelector(".print-label");
  var knobs = root.querySelectorAll(".print-knob");
  if (!label || !knobs.length) return;
  knobs.forEach(function (knob) {
    knob.addEventListener("click", function () {
      var on = knob.getAttribute("aria-pressed") !== "true";
      knob.setAttribute("aria-pressed", on ? "true" : "false");
      knob.classList.toggle("on", on);
      label.classList.toggle("print-off-" + knob.dataset.t, !on);
    }, { passive: true });
  });
})();


/* ===== close ===== */
(function () { "use strict";
  var sec = document.getElementById("personal");
  if (!sec) return;
  var spans = sec.querySelectorAll("[data-accent-name]");
  if (!spans.length) return;
  var NAMES = { clay: "Clay", ink: "Ink", ocean: "Ocean", sage: "Sage", honey: "Honey", plum: "Plum" };
  var doc = document.documentElement;
  function sync() {
    var a = doc.dataset.accent || "clay";
    var label = NAMES[a] || (a.charAt(0).toUpperCase() + a.slice(1));
    for (var i = 0; i < spans.length; i++) {
      if (spans[i].textContent !== label) spans[i].textContent = label;
    }
  }
  sync();
  if ("MutationObserver" in window) {
    new MutationObserver(sync).observe(doc, { attributes: true, attributeFilter: ["data-accent"] });
  }
})();
