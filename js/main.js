
(() => {
  "use strict";

  /* ---------- Wedding details ---------- */

  const MUHURTHAM = new Date("2027-02-26T06:00:00+05:30").getTime();

  // Replace with your actual published invitation URL.
  const SITE_URL = "YOUR_PUBLISHED_INVITATION_URL";

  const VENUE = "GKM Palace, Madurai, Tamil Nadu";

  const MAPS =
    "https://www.google.com/maps/search/?api=1&query=GKM+Palace%2C+Madurai";

  const reduceMotion = windowI.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const finePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;

  const INTERACTIVE_SELECTOR =
    "a, button, .interactive, .selectable, input, textarea, select, label, summary";

  function isInteractive(target) {
    return !!(
      target &&
      target.closest &&
      target.closest(INTERACTIVE_SELECTOR)
    );
  }

  /* ---------- Countdown ---------- */

  const countdownEl = document.getElementById("countdown");

  const units = {
    days: countdownEl?.querySelector('[data-unit="days"]'),
    hours: countdownEl?.querySelector('[data-unit="hours"]'),
    mins: countdownEl?.querySelector('[data-unit="mins"]'),
    secs: countdownEl?.querySelector('[data-unit="secs"]'),
  };

  function pad(n) {
    return String(Math.max(0, n)).padStart(2, "0");
  }

  function tickCountdown() {
    let diff = Math.max(0, MUHURTHAM - Date.now());

    const days = Math.floor(diff / 86400000);
    diff -= days * 86400000;

    const hours = Math.floor(diff / 3600000);
    diff -= hours * 3600000;

    const mins = Math.floor(diff / 60000);
    diff -= mins * 60000;

    const secs = Math.floor(diff / 1000);

    if (units.days) units.days.textContent = pad(days);
    if (units.hours) units.hours.textContent = pad(hours);
    if (units.mins) units.mins.textContent = pad(mins);
    if (units.secs) units.secs.textContent = pad(secs);
  }

  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ---------- Audio helpers ---------- */

  let audioCtx = null;

  const bloopEl = document.getElementById("bloopSound");

  let lastBloop = 0;

  function ensureAudio() {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) return null;

      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }

    return audioCtx;
  }

  function playBloop() {
    const now = performance.now();

    if (now - lastBloop < 80) return;

    lastBloop = now;

    try {
      ensureAudio();

      if (bloopEl) {
        const node = bloopEl.cloneNode(true);

        node.volume = 0.45;

        node.play().catch(() => {});

        node.addEventListener("ended", () => node.remove());

        return;
      }
    } catch (_) {
      /* Fall through to generated tone. */
    }

    try {
      const ctxA = ensureAudio();

      if (!ctxA) return;

      const t0 = ctxA.currentTime;

      const osc = ctxA.createOscillator();
      const gain = ctxA.createGain();

      osc.type = "sine";

      osc.frequency.setValueAtTime(880, t0);
      osc.frequency.exponentialRampToValueAtTime(320, t0 + 0.14);

      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.07, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);

      osc.connect(gain);
      gain.connect(ctxA.destination);

      osc.start(t0);
      osc.stop(t0 + 0.2);
    } catch (_) {
      /* Ignore audio errors. */
    }
  }

  /* ---------- Ripples ---------- */

  const rippleLayer = document.getElementById("ripples");

  function spawnRipple(x, y) {
    if (!rippleLayer || reduceMotion) return;

    const el = document.createElement("span");

    el.className = "ripple";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    rippleLayer.appendChild(el);

    el.addEventListener("animationend", () => el.remove());
  }

  document.addEventListener(
    "pointerdown",
    (e) => {
      if (e.button !== undefined && e.button !== 0) return;

      playBloop();

      if (isInteractive(e.target)) return;

      if (
        e.target &&
        e.target.closest &&
        e.target.closest("#scratchCanvas")
      ) {
        return;
      }

      spawnRipple(e.clientX, e.clientY);
    },
    { passive: true }
  );

  /* ---------- Custom cursor + global parallax ---------- */

  const cursor = document.getElementById("cursor");

  const cursorRing = cursor?.querySelector(".cursor__ring");
  const cursorDot = cursor?.querySelector(".cursor__dot");

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  let ringX = mouseX;
  let ringY = mouseY;

  let dotX = mouseX;
  let dotY = mouseY;

  let globalPX = 0;
  let globalPY = 0;

  let targetPX = 0;
  let targetPY = 0;

  const hero = document.getElementById("hero");

  const layers = hero
    ? [...hero.querySelectorAll("[data-speed]")].map((el) => ({
        el,
        speed: parseFloat(el.dataset.speed) || 0,
      }))
    : [];

  const tiltEls = [];

  document
    .querySelectorAll(
      ".invite__photo, .memory__frame, .timeline__item, .scratch, .venue__hands"
    )
    .forEach((el) => {
      el.classList.add("tilt");
      tiltEls.push(el);
    });

  if (finePointer && !reduceMotion && cursor) {
    document.body.classList.add("has-cursor");

    window.addEventListener(
      "pointermove",
      (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        targetPX = (e.clientX / window.innerWidth - 0.5) * 2;
        targetPY = (e.clientY / window.innerHeight - 0.5) * 2;

        cursor.classList.toggle(
          "is-hover",
          isInteractive(e.target)
        );
      },
      { passive: true }
    );

    window.addEventListener(
      "pointerdown",
      () => cursor.classList.add("is-down"),
      { passive: true }
    );

    window.addEventListener(
      "pointerup",
      () => cursor.classList.remove("is-down"),
      { passive: true }
    );

    function animateCursor() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;

      dotX += (mouseX - dotX) * 0.45;
      dotY += (mouseY - dotY) * 0.45;

      globalPX += (targetPX - globalPX) * 0.08;
      globalPY += (targetPY - globalPY) * 0.08;

      if (cursorRing) {
        cursorRing.style.transform =
          `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      }

      if (cursorDot) {
        cursorDot.style.transform =
          `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
      }

      updateParallax();

      requestAnimationFrame(animateCursor);
    }

    requestAnimationFrame(animateCursor);
  }

  /* ---------- Hero + responsive parallax ---------- */

 let scrollTicking = false;

  function updateParallax() {
    if (!hero || reduceMotion) return;

    const rect = hero.getBoundingClientRect();
    const viewH = window.innerHeight || 1;

    const progress = Math.min(1, Math.max(0, -rect.top / (rect.height || 1)));
    const mid = (viewH / 2 - (rect.top + rect.height / 2)) / viewH;

    // 1. Batch all DOM READS first
    const layerUpdates = layers.map(({ el, speed }) => {
      const y = progress * speed * 140 + mid * speed * 40 + globalPY * speed * 16;
      const x = globalPX * speed * 28;
      return { el, x, y };
    });

    const tiltUpdates = [];
    if (finePointer) {
      tiltEls.forEach((el) => {
        const r = el.getBoundingClientRect();
        const inView = r.bottom > 0 && r.top < viewH;
        
        if (!inView) {
          tiltUpdates.push({ el, transform: "" });
          return;
        }

        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = (mouseX - cx) / (r.width || 1);
        const dy = (mouseY - cy) / (r.height || 1);
        const near = Math.abs(dx) < 1.2 && Math.abs(dy) < 1.2;

        if (!near) {
          tiltUpdates.push({ el, transform: "" });
          return;
        }

        const rx = Math.max(-6, Math.min(6, -dy * 6));
        const ry = Math.max(-8, Math.min(8, dx * 8));
        
        tiltUpdates.push({ 
          el, 
          transform: `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translate3d(${dx * 4}px, ${dy * 3}px, 0)` 
        });
      });
    }

    // 2. Batch all DOM WRITES second (This prevents Layout Thrashing)
    layerUpdates.forEach(({ el, x, y }) => {
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });

    tiltUpdates.forEach(({ el, transform }) => {
      el.style.transform = transform;
    });

    scrollTicking = false;
  }

  function requestParallax() {
    if (scrollTicking) return;

    scrollTicking = true;

    requestAnimationFrame(updateParallax);
  }

  window.addEventListener("scroll", requestParallax, {
    passive: true,
  });

  window.addEventListener("resize", requestParallax);

  /* ---------- Touch parallax ---------- */

  if (!finePointer && !reduceMotion) {
    window.addEventListener(
      "touchmove",
      (e) => {
        const t = e.touches[0];

        if (!t) return;

        targetPX = (t.clientX / window.innerWidth - 0.5) * 2;
        targetPY = (t.clientY / window.innerHeight - 0.5) * 2;

        globalPX += (targetPX - globalPX) * 0.2;
        globalPY += (targetPY - globalPY) * 0.2;

        requestParallax();
      },
      { passive: true }
    );
  }

  updateParallax();

  /* ---------- Scroll reveals ---------- */

  const reveals = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Soft petal particles ---------- */

  const canvas = document.getElementById("petals");
  const ctx = canvas?.getContext("2d");

  if (canvas && ctx && !reduceMotion) {
    let w = 0;
    let h = 0;
    let petals = [];

    const COUNT = window.matchMedia("(max-width: 700px)").matches
      ? 24
      : 38;

    function resizePetals() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function makePetal() {
      const blush = [
        "rgba(247,197,205,",
        "rgba(240,170,182,",
        "rgba(232,140,155,",
      ];

      const redRose = [
        "rgba(198,58,78,",
        "rgba(176,42,62,",
        "rgba(212,78,96,",
      ];

      const palette = Math.random() > 0.42 ? blush : redRose;

      return {
        x: Math.random() * w,
        y: Math.random() * h - h,
        r: 2.8 + Math.random() * 3.6,
        slim: 0.38 + Math.random() * 0.2,
        vy: 0.35 + Math.random() * 0.7,
        vx: -0.3 + Math.random() * 0.6,
        rot: Math.random() * Math.PI * 2,
        vr: -0.03 + Math.random() * 0.06,
        hue: palette[(Math.random() * palette.length) | 0],
        a: 0.28 + Math.random() * 0.34,
        tip: 0.7 + Math.random() * 0.25,
      };
    }

    function initPetals() {
      petals = Array.from({ length: COUNT }, makePetal);
    }

    function drawPetal(p) {
      ctx.save();

      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);

      const hw = p.r * p.slim;

      ctx.beginPath();

      ctx.moveTo(0, -p.r * p.tip);

      ctx.bezierCurveTo(
        hw,
        -p.r * 0.4,
        hw * 0.9,
        p.r * 0.45,
        0,
        p.r * 0.9
      );

      ctx.bezierCurveTo(
        -hw * 0.9,
        p.r * 0.45,
        -hw,
        -p.r * 0.4,
        0,
        -p.r * p.tip
      );

      ctx.closePath();

      ctx.fillStyle = p.hue + p.a + ")";
      ctx.fill();

      ctx.restore();
    }

    function framePetals() {
      ctx.clearRect(0, 0, w, h);

      petals.forEach((p) => {
        p.x +=
          p.vx +
          Math.sin(p.y * 0.01) * 0.15 +
          globalPX * 0.15;

        p.y += p.vy;
        p.rot += p.vr;

        if (p.y > h + 20) {
          p.y = -20;
          p.x = Math.random() * w;
        }

        drawPetal(p);
      });

      requestAnimationFrame(framePetals);
    }

    resizePetals();
    initPetals();
    framePetals();

    window.addEventListener("resize", () => {
      resizePetals();
      initPetals();
    });
  }

  /* ---------- Scratch card ---------- */

  const scratchCard = document.getElementById("scratchCard");
  const scratchCanvas = document.getElementById("scratchCanvas");
  const scratchGuide = document.getElementById("scratchGuide");

  if (scratchCanvas && scratchCard) {
    const sctx = scratchCanvas.getContext("2d", {
      willReadFrequently: true,
    });

    let scratching = false;
    let last = null;
    let revealed = false;

    function paintFoil(w, h) {
      const grad = sctx.createLinearGradient(0, 0, w, h);

      grad.addColorStop(0, "#e8d4b0");
      grad.addColorStop(0.35, "#c4a06a");
      grad.addColorStop(0.7, "#d8b87a");
      grad.addColorStop(1, "#b8956c");

      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, w, h);

      sctx.strokeStyle = "rgba(255,255,255,0.18)";
      sctx.lineWidth = 1;

      for (let i = -h; i < w + h; i += 14) {
        sctx.beginPath();
        sctx.moveTo(i, 0);
        sctx.lineTo(i + h, h);
        sctx.stroke();
      }

      sctx.fillStyle = "rgba(255,255,255,0.22)";
      sctx.beginPath();

      sctx.arc(
        w / 2,
        h / 2,
        Math.min(w, h) * 0.18,
        0,
        Math.PI * 2
      );

      sctx.fill();
    }

    function sizeScratch() {
      const rect = scratchCard.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      scratchCanvas.width = Math.max(
        1,
        Math.floor(rect.width * dpr)
      );

      scratchCanvas.height = Math.max(
        1,
        Math.floor(rect.height * dpr)
      );

      scratchCanvas.style.width = `${rect.width}px`;
      scratchCanvas.style.height = `${rect.height}px`;

      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      paintFoil(rect.width, rect.height);
    }

    function scratchAt(x, y) {
      const rect = scratchCanvas.getBoundingClientRect();

      const px = x - rect.left;
      const py = y - rect.top;

      const radius = Math.max(
        36,
        Math.min(rect.width, rect.height) * 0.12
      );

      sctx.globalCompositeOperation = "destination-out";

      sctx.beginPath();
      sctx.arc(px, py, radius, 0, Math.PI * 2);
      sctx.fill();

      if (last) {
        sctx.lineWidth = radius * 2;
        sctx.lineCap = "round";
        sctx.lineJoin = "round";

        sctx.beginPath();
        sctx.moveTo(last.x, last.y);
        sctx.lineTo(px, py);
        sctx.stroke();
      }

      last = { x: px, y: py };

      sctx.globalCompositeOperation = "source-over";
    }

    function measureReveal() {
      if (revealed) return;

      const w = scratchCanvas.width;
      const h = scratchCanvas.height;

      const sample = sctx.getImageData(0, 0, w, h).data;

      let clear = 0;

      const step = 16;

      for (let i = 3; i < sample.length; i += 4 * step) {
        if (sample[i] < 40) clear += 1;
      }

      const total = sample.length / (4 * step);

      if (clear / total > 0.18) {
        revealed = true;

        scratchCard.classList.add("is-done");

        scratchCanvas.style.transition = "opacity 0.45s ease";
        scratchCanvas.style.opacity = "0";

        setTimeout(() => {
          scratchCanvas.style.pointerEvents = "none";
        }, 450);

        if (scratchGuide) {
          scratchGuide.textContent = "Revealed";
        }

        playBloop();
        burstConfetti();
        showToast("Muhurtham unlocked");
      }
    }

    function pointerPos(e) {
      return {
        x: e.clientX,
        y: e.clientY,
      };
    }

    function onStart(e) {
      if (revealed) return;

      scratching = true;

      scratchCard.classList.add("is-scratching");

      last = null;

      const p = pointerPos(e);

      scratchAt(p.x, p.y);

      if (scratchCanvas.setPointerCapture) {
        try {
          scratchCanvas.setPointerCapture(e.pointerId);
        } catch (_) {}
      }

      e.preventDefault();
    }

    function onMove(e) {
      if (!scratching || revealed) return;

      const p = pointerPos(e);

      scratchAt(p.x, p.y);

      if (Math.random() > 0.7) {
        measureReveal();
      }

      e.preventDefault();
    }

    function onEnd() {
      if (!scratching) return;

      scratching = false;
      last = null;

      measureReveal();
    }

    sizeScratch();

    window.addEventListener("resize", () => {
      if (!revealed) sizeScratch();
    });

    scratchCanvas.addEventListener("pointerdown", onStart);
    scratchCanvas.addEventListener("pointermove", onMove);
    scratchCanvas.addEventListener("pointerup", onEnd);
    scratchCanvas.addEventListener("pointercancel", onEnd);
    scratchCanvas.addEventListener("lostpointercapture", onEnd);
  }

  /* ---------- Toast ---------- */

  const toast = document.getElementById("toast");

  let toastTimer = null;

  function showToast(message) {
    if (!toast) return;

    toast.hidden = false;
    toast.textContent = message;

    requestAnimationFrame(() => {
      toast.classList.add("is-on");
    });

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove("is-on");

      setTimeout(() => {
        toast.hidden = true;
      }, 350);
    }, 2200);
  }

  /* ---------- WhatsApp share ---------- */

  // const shareText =
  //   "You're invited to the wedding of Praveenkumar & Devadharshini!\n\n" +
  //   "- Engagement · 25 February 2027, 6:30 PM onwards\n" +
  //   "- Wedding · 26 February 2027, 6:00 AM onwards\n" +
  //   "- Reception · 28 February 2027, 6:00 PM onwards\n\n" +
  //   "Venue: GKM Palace, Madurai\n" +
  //   "Location: " + MAPS + "\n\n" +
  //   SITE_URL;

    const shareText =
    "You're invited to the wedding of Praveenkumar & Devadharshini!\n\n -  Nichayathartham (Engagement) · 25 Feb 2027, 6:30 PM onwards\n\n - Muhurtham · 26 Feb 2027, 06:00 AM – 07:29 AM\n\n - GKM Palace, Madurai.\n - Reception · 28 Feb 2027, 06:00 PM onwards\n\n Coimbatore" +
    SITE_URL;

  const waUrl =
    `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  function openWhatsApp() {
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  const shareBtnVenue = document.getElementById("shareBtnVenue");

  if (shareBtnVenue) {
    shareBtnVenue.href = waUrl;
    shareBtnVenue.target = "_blank";
    shareBtnVenue.rel = "noopener noreferrer";
  }

  document.getElementById("shareBtn")?.addEventListener(
    "click",
    (e) => {
      e.preventDefault();
      openWhatsApp();
    }
  );

  /* ---------- Tab attention title ---------- */

  const baseTitle = document.title;

  const awayTitles = [
    "Psst… you're invited!",
    "Save the date · February 2027",
    "Praveenkumar & Devadharshini",
    "Don't miss our special day!",
    "Come back — you're invited!",
  ];

  let awayIdx = 0;
  let awayTimer = null;

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      document.title = awayTitles[awayIdx % awayTitles.length];

      clearInterval(awayTimer);

      awayTimer = setInterval(() => {
        awayIdx += 1;
        document.title = awayTitles[awayIdx % awayTitles.length];
      }, 2800);
    } else {
      clearInterval(awayTimer);
      awayTimer = null;
      document.title = baseTitle;
    }
  });

  /* ---------- Confetti ---------- */

  function burstConfetti() {
    if (reduceMotion) return;

    const layer = document.getElementById("confetti");

    if (!layer) return;

    const ctxC = layer.getContext("2d");

    if (!ctxC) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    layer.width = window.innerWidth * dpr;
    layer.height = window.innerHeight * dpr;

    layer.style.width = "100%";
    layer.style.height = "100%";

    ctxC.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = [
      "#f7c5cd",
      "#f0aab6",
      "#e88c9b",
      "#c63a4e",
      "#b02a3e",
      "#d44e60",
      "#e9c5c8",
    ];

    const parts = Array.from({ length: 56 }, () => ({
      x: window.innerWidth * (0.35 + Math.random() * 0.3),
      y: window.innerHeight * 0.35,
      vx: -5 + Math.random() * 10,
      vy: -8 - Math.random() * 7,
      g: 0.18 + Math.random() * 0.12,
      r: 3 + Math.random() * 5,
      rot: Math.random() * Math.PI * 2,
      vr: -0.2 + Math.random() * 0.4,
      color: colors[(Math.random() * colors.length) | 0],
      kind: Math.random() > 0.25 ? "petal" : "dot",
      life: 1,
    }));

    let frames = 0;

    function tick() {
      frames += 1;

      ctxC.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
      );

      parts.forEach((p) => {
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 0.012;

        ctxC.save();

        ctxC.translate(p.x, p.y);
        ctxC.rotate(p.rot);
        ctxC.globalAlpha = Math.max(0, p.life);
        ctxC.fillStyle = p.color;

        if (p.kind === "petal") {
          ctxC.beginPath();
          ctxC.ellipse(
            0,
            0,
            p.r * 1.4,
            p.r * 0.7,
            0,
            0,
            Math.PI * 2
          );
          ctxC.fill();
        } else {
          ctxC.beginPath();
          ctxC.arc(0, 0, p.r * 0.55, 0, Math.PI * 2);
          ctxC.fill();
        }

        ctxC.restore();
      });

      if (frames < 110) {
        requestAnimationFrame(tick);
      } else {
        ctxC.clearRect(
          0,
          0,
          window.innerWidth,
          window.innerHeight
        );
      }
    }

    requestAnimationFrame(tick);
  }

  /* ---------- Calendar events ---------- */

  const events = {
    reception: {
      title: "Reception — Praveenkumar & Devadharshini",
      description:
        `Wedding reception of Praveenkumar & Devadharshini (6:00 PM onwards).\n` +
        `Venue: ${VENUE}\n` +
        `Maps: ${MAPS}\n` +
        `Invite: ${SITE_URL}`,
      location: VENUE,
      start: "20270228T180000",
      end: "20270228T230000",
    },

    engagement: {
      title: "Engagement — Praveenkumar & Devadharshini",
      description:
        `Engagement of Praveenkumar & Devadharshini (6:30 PM onwards).\n` +
        `Venue: ${VENUE}\n` +
        `Maps: ${MAPS}\n` +
        `Invite: ${SITE_URL}`,
      location: VENUE,
      start: "20270225T183000",
      end: "20270225T203000",
    },

    muhurtham: {
      title: "Wedding — Praveenkumar & Devadharshini",
      description:
        `Wedding of Praveenkumar & Devadharshini (6:00 AM onwards).\n` +
        `Venue: ${VENUE}\n` +
        `Maps: ${MAPS}\n` +
        `Invite: ${SITE_URL}`,
      location: VENUE,
      start: "20270226T060000",
      end: "20270226T080000",
    },
  };

  function googleCalUrl(event) {
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: event.title,
      dates: `${event.start}/${event.end}`,
      ctz: "Asia/Kolkata",
      details: event.description,
      location: event.location,
    });

    return (
      "https://calendar.google.com/calendar/render?" +
      params.toString()
    );
  }

  document.querySelectorAll("[data-gcal]").forEach((link) => {
    const key = link.getAttribute("data-gcal");
    const event = events[key];

    if (event) {
      link.href = googleCalUrl(event);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
  });

  /* ---------- Entry veil + music ---------- */

  const entryVeil = document.getElementById("entryVeil");
  const entryVeilBtn = document.getElementById("entryVeilBtn");

  const musicBtn = document.getElementById("musicBtn");
  const bgMusic = document.getElementById("bgMusic");

  const speakerOn = musicBtn?.querySelector(
    ".icon-btn__speaker--on"
  );

  const speakerOff = musicBtn?.querySelector(
    ".icon-btn__speaker--off"
  );

  let musicPlaying = false;
  let musicMuted = false;
  let pendingUnmute = false;
  let gestureArmed = false;
  let veilOpen = !!entryVeil;

  function syncMusicIcon() {
    if (!musicBtn) return;

    const showSpeaker = !musicMuted;

    musicBtn.classList.toggle("is-muted", musicMuted);

    musicBtn.setAttribute(
      "aria-pressed",
      showSpeaker ? "true" : "false"
    );

    musicBtn.setAttribute(
      "aria-label",
      showSpeaker ? "Mute music" : "Unmute music"
    );

    if (speakerOn) {
      speakerOn.hidden = !showSpeaker;

      speakerOn.setAttribute(
        "aria-hidden",
        showSpeaker ? "false" : "true"
      );
    }

    if (speakerOff) {
      speakerOff.hidden = showSpeaker;

      speakerOff.setAttribute(
        "aria-hidden",
        showSpeaker ? "true" : "false"
      );
    }
  }

  function applyAudibleState() {
    if (!bgMusic) return;

    bgMusic.muted = musicMuted || pendingUnmute;
    bgMusic.volume = musicMuted ? 0 : 0.35;

    syncMusicIcon();
  }

  function musicIsAudible() {
    return musicPlaying && !musicMuted && !pendingUnmute;
  }

  function clearGestureUnlock() {
    if (!gestureArmed) return;

    gestureArmed = false;

    window.removeEventListener(
      "pointerdown",
      onGestureUnlock,
      true
    );

    window.removeEventListener(
      "touchstart",
      onGestureUnlock,
      true
    );

    window.removeEventListener(
      "click",
      onGestureUnlock,
      true
    );

    window.removeEventListener(
      "keydown",
      onGestureUnlock,
      true
    );

    window.removeEventListener(
      "wheel",
      onGestureUnlock,
      true
    );

    window.removeEventListener(
      "scroll",
      onGestureUnlock,
      true
    );

    window.removeEventListener(
      "touchmove",
      onGestureUnlock,
      true
    );
  }

  function onGestureUnlock(e) {
    if (veilOpen) return;

    if (e?.target?.closest?.("#musicBtn")) return;

    if (musicMuted) {
      clearGestureUnlock();
      return;
    }

    if (musicIsAudible()) {
      clearGestureUnlock();
      return;
    }

    if (!bgMusic) return;

    if (pendingUnmute && musicPlaying) {
      pendingUnmute = false;
      applyAudibleState();
      clearGestureUnlock();
      return;
    }

    pendingUnmute = false;
    musicMuted = false;

    bgMusic.muted = false;
    bgMusic.volume = 0.35;

    bgMusic
      .play()
      .then(() => {
        musicPlaying = true;
        syncMusicIcon();
        clearGestureUnlock();
      })
      .catch(() => {
        /* Wait for another user gesture. */
      });
  }

  function armGestureUnlock() {
    if (gestureArmed || musicIsAudible()) return;

    gestureArmed = true;

    window.addEventListener(
      "pointerdown",
      onGestureUnlock,
      true
    );

    window.addEventListener(
      "touchstart",
      onGestureUnlock,
      { capture: true, passive: true }
    );

    window.addEventListener(
      "click",
      onGestureUnlock,
      true
    );

    window.addEventListener(
      "keydown",
      onGestureUnlock,
      true
    );

    window.addEventListener(
      "wheel",
      onGestureUnlock,
      { capture: true, passive: true }
    );

    window.addEventListener(
      "scroll",
      onGestureUnlock,
      { capture: true, passive: true }
    );

    window.addEventListener(
      "touchmove",
      onGestureUnlock,
      { capture: true, passive: true }
    );
  }

  async function startMusicAudible() {
    if (!bgMusic) return false;

    try {
      const ctx = ensureAudio();

      if (ctx?.state === "suspended") {
        await ctx.resume();
      }
    } catch (_) {
      /* HTML audio can still work without Web Audio. */
    }

    pendingUnmute = false;
    musicMuted = false;

    bgMusic.muted = false;
    bgMusic.volume = 0.35;

    try {
      await bgMusic.play();

      musicPlaying = true;

      syncMusicIcon();
      clearGestureUnlock();

      return true;
    } catch (_) {
      musicPlaying = false;

      syncMusicIcon();

      return false;
    }
  }

  async function bootMusicQuiet() {
    if (!bgMusic || veilOpen) return;

    armGestureUnlock();

    try {
      bgMusic.muted = true;
      bgMusic.volume = 0.35;

      await bgMusic.play();

      musicPlaying = true;
      pendingUnmute = true;
      musicMuted = false;

      syncMusicIcon();
    } catch (_) {
      musicPlaying = false;
      pendingUnmute = false;

      syncMusicIcon();
    }
  }

  function dismissEntryVeil() {
    if (!entryVeil || !veilOpen) return;

    veilOpen = false;

    document.body.classList.remove("is-veiled");

    entryVeil.classList.add("is-leaving");

    const remove = () => {
      if (entryVeil.isConnected) {
        entryVeil.remove();
      }
    };

    if (reduceMotion) {
      remove();
      return;
    }

    entryVeil.addEventListener(
      "transitionend",
      remove,
      { once: true }
    );

    window.setTimeout(remove, 1100);
  }

  // Close the veil immediately. Audio playback must not block the button.
  function openEntryVeil(e) {
    e?.preventDefault();
    e?.stopPropagation();

    if (!veilOpen) return;

    if (entryVeilBtn) {
      entryVeilBtn.disabled = true;
    }

    dismissEntryVeil();

    startMusicAudible().then((ok) => {
      if (!ok) {
        armGestureUnlock();
        showToast("Tap once more if the music is quiet");
      }
    });
  }

  syncMusicIcon();

  if (entryVeil && entryVeilBtn) {
    entryVeilBtn.addEventListener("click", openEntryVeil);

    // Native button already supports Enter and Space.
    // No additional keydown listener is needed.

    if (bgMusic) {
      const warm = async () => {
        if (!veilOpen) return;

        try {
          bgMusic.muted = true;
          bgMusic.volume = 0.35;

          await bgMusic.play();

          musicPlaying = true;
          pendingUnmute = true;
          musicMuted = false;

          syncMusicIcon();
        } catch (_) {
          musicPlaying = false;
          pendingUnmute = false;

          syncMusicIcon();
        }
      };

      if (bgMusic.readyState >= 2) {
        warm();
      } else {
        bgMusic.addEventListener("canplay", warm, {
          once: true,
        });
      }
    }
  } else {
    armGestureUnlock();

    if (bgMusic) {
      const kick = () => bootMusicQuiet();

      if (bgMusic.readyState >= 2) {
        kick();
      } else {
        bgMusic.addEventListener("canplay", kick, {
          once: true,
        });
      }

      window.addEventListener("load", kick, {
        once: true,
      });
    }
  }  function requestParallax() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(updateParallax);
  }

  musicBtn?.addEventListener("click", async (e) => {
    e.stopPropagation();

    if (!bgMusic) return;

    if (!musicPlaying) {
      const ok = await startMusicAudible();

      if (!ok) {
        showToast("Couldn't start music — try tapping again");
      }

      return;
    }

    musicMuted = !musicMuted;

    if (musicMuted) {
      pendingUnmute = false;
    }

    applyAudibleState();
  });

})();
