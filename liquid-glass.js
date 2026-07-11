/* ============================================================
   AL REEF — LIQUID GLASS BEHAVIOR LAYER
   Load with `defer` right before </body>, after your existing
   scripts. Purely additive — does not touch loadFleet(), the
   booking modal, i18n, or any existing logic.
   ============================================================ */
(function () {
  "use strict";

  /* 1. Nav shrink-on-scroll -------------------------------- */
  const nav = document.querySelector(".glass-nav");
  if (nav) {
    const toggleNav = () => {
      nav.classList.toggle("is-scrolled", window.scrollY > 40);
    };
    toggleNav();
    window.addEventListener("scroll", toggleNav, { passive: true });
  }

  /* 2. 3D tilt on car / service cards ----------------------- */
  const MAX_TILT = 8; // degrees
  function attachTilt(card) {
    if (card.dataset.tiltBound) return;
    card.dataset.tiltBound = "1";

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;  // 0..1
      const py = (e.clientY - rect.top) / rect.height;  // 0..1
      const rx = (px - 0.5) * MAX_TILT * 2;
      const ry = (0.5 - py) * MAX_TILT * 2;
      card.style.setProperty("--rx", rx.toFixed(2) + "deg");
      card.style.setProperty("--ry", ry.toFixed(2) + "deg");
    });
    card.addEventListener("mouseleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  }

  // Cards that exist at load time (services.html, static markup)
  document.querySelectorAll(".car-card, .service-card").forEach(attachTilt);

  // Cards injected later by loadFleet() on index.html
  const fleetGrid = document.getElementById("fleet-grid");
  if (fleetGrid && "MutationObserver" in window) {
    new MutationObserver((mutations) => {
      mutations.forEach((m) =>
        m.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.matches(".car-card")) attachTilt(node);
        })
      );
    }).observe(fleetGrid, { childList: true });
  }

  /* 3. Animated stat counters (opt-in) ----------------------
     Add markup like:
     <span class="stat-counter" data-count-to="1200">0</span>
     anywhere on the page and it will count up once visible.   */
  const counters = document.querySelectorAll(".stat-counter[data-count-to]");
  if (counters.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          io.unobserve(el);
          const target = parseInt(el.dataset.countTo, 10) || 0;
          const duration = 1200;
          const start = performance.now();
          function tick(now) {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(eased * target).toLocaleString();
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach((c) => io.observe(c));
  }
})();
