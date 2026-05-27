/* ============================================================
   Animated homophily network — Mauritz Cartier van Dissel
   A subtle nod to the research: two groups of nodes that gently
   drift toward similar nodes (homophily), with edges fading in
   based on proximity. Pure vanilla JS / Canvas, no dependencies.
   ============================================================ */

(function () {
  const canvas = document.getElementById('network-canvas');
  if (!canvas) return;

  const SIZE = canvas.clientWidth || 280;
  const DPR = window.devicePixelRatio || 1;
  canvas.width = SIZE * DPR;
  canvas.height = SIZE * DPR;

  const ctx = canvas.getContext('2d');
  ctx.scale(DPR, DPR);

  // Read theme colors from CSS variables so the animation stays in sync
  const css = getComputedStyle(document.documentElement);
  const COLOR_A = css.getPropertyValue('--accent').trim()   || '#7d2828';
  const COLOR_B = css.getPropertyValue('--accent-2').trim() || '#2d4a6b';
  const COLORS = [COLOR_A, COLOR_B];

  const NUM_NODES     = 26;
  const CONNECT_DIST  = 70;
  const HOMOPHILY     = 0.0006;  // gentle pull toward same-group neighbors
  const REPULSION     = 0.012;   // short-range repulsion (no overlap)
  const FRICTION      = 0.955;
  const JITTER        = 0.018;   // tiny randomness keeps it alive

  // Initialize nodes
  const nodes = [];
  for (let i = 0; i < NUM_NODES; i++) {
    nodes.push({
      x: 20 + Math.random() * (SIZE - 40),
      y: 20 + Math.random() * (SIZE - 40),
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      group: Math.random() < 0.5 ? 0 : 1,
      r: 2 + Math.random() * 1.4,
    });
  }

  function step() {
    // ---- physics ----
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];

      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 1) continue;
        const d = Math.sqrt(d2);

        // Homophily: attraction toward same-group neighbors in a mid range
        if (a.group === b.group && d > 30 && d < 130) {
          a.vx += (dx / d) * HOMOPHILY;
          a.vy += (dy / d) * HOMOPHILY;
        }

        // Short-range repulsion so nodes don't stack
        if (d < 22) {
          a.vx -= (dx / d) * REPULSION;
          a.vy -= (dy / d) * REPULSION;
        }
      }

      // Wall containment
      if (a.x < 12)        a.vx += 0.02;
      if (a.x > SIZE - 12) a.vx -= 0.02;
      if (a.y < 12)        a.vy += 0.02;
      if (a.y > SIZE - 12) a.vy -= 0.02;

      // Friction + tiny jitter
      a.vx = a.vx * FRICTION + (Math.random() - 0.5) * JITTER;
      a.vy = a.vy * FRICTION + (Math.random() - 0.5) * JITTER;

      a.x += a.vx;
      a.y += a.vy;
    }

    // ---- render ----
    ctx.clearRect(0, 0, SIZE, SIZE);

    // edges
    ctx.lineWidth = 0.7;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < CONNECT_DIST) {
          const alpha = (1 - d / CONNECT_DIST) * 0.35;
          ctx.strokeStyle = 'rgba(50, 50, 50,' + alpha + ')';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // nodes
    for (const n of nodes) {
      ctx.fillStyle = COLORS[n.group];
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(step);
  }

  step();
})();
