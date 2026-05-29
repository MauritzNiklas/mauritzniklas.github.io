/* Full-screen interactive homophily network
   Added as a second animation. Does not modify network.js.
*/

(function () {
  const canvas = document.getElementById('network-full');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const DPR = window.devicePixelRatio || 1;

  let width = window.innerWidth;
  let height = window.innerHeight;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.max(300, width) * DPR;
    canvas.height = Math.max(300, height) * DPR;

    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    canvas.style.position = 'fixed';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.zIndex = '0';
    canvas.style.pointerEvents = 'none'; // don't block clicks

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  window.addEventListener('resize', resize);
  resize();

  // Parameters (tuned for full-screen)
  const NUM_NODES = 200;
  const CONNECT_DISTANCE = 120;
  const HOMOPHILY_FORCE = 0.0022;
  const CROSS_ATTRACTION = 0.00015;
  const REPULSION = 0.3; // 0.018;
  const FRICTION = 0.98; //0.965;
  const BASE_JITTER = 0.03;  //0.012;
  const MOUSE_RADIUS = 180;
  const MOUSE_FORCE = 0.09;
  const TURBULENCE = 0.11;

  const css = getComputedStyle(document.documentElement);
  const COLOR_A = css.getPropertyValue('--accent').trim() || '#7d2828';
  const COLOR_B = css.getPropertyValue('--accent-2').trim() || '#2d4a6b';

  const colors = [COLOR_A, COLOR_B];

  // Mouse tracked on window since canvas is pointer-events:none
  const mouse = { x: -9999, y: -9999, active: false };

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });

  window.addEventListener('mouseleave', () => {
    mouse.active = false;
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // Nodes
  const nodes = [];
  for (let i = 0; i < NUM_NODES; i++) {
    const group = Math.random() < 0.5 ? 0 : 1;
    nodes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: 2 + Math.random() * 2.5,
      group
    });
  }

  function update() {
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];

      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 0.01) continue;
        const d = Math.sqrt(d2);

        if (a.group === b.group) {
          if (d > 25 && d < 220) {
            const f = HOMOPHILY_FORCE;
            a.vx += (dx / d) * f;
            a.vy += (dy / d) * f;
          }
        } else {
          if (d > 80 && d < 180) {
            a.vx += (dx / d) * CROSS_ATTRACTION;
            a.vy += (dy / d) * CROSS_ATTRACTION;
          }
        }

        if (d < 18) {
          const force = REPULSION * (1 - d / 18);
          a.vx -= (dx / d) * force;
          a.vy -= (dy / d) * force;
        }
      }

      // Mouse disruption field
      if (mouse.active) {
        const mdx = a.x - mouse.x;
        const mdy = a.y - mouse.y;
        const md2 = mdx * mdx + mdy * mdy;
        const md = Math.sqrt(md2);
        if (md < MOUSE_RADIUS) {
          const strength = 1 - md / MOUSE_RADIUS;
          a.vx += (mdx / md) * MOUSE_FORCE * strength;
          a.vy += (mdy / md) * MOUSE_FORCE * strength;
          a.vx += (Math.random() - 0.5) * TURBULENCE * strength;
          a.vy += (Math.random() - 0.5) * TURBULENCE * strength;
        }
      }

      // Walls
      const margin = 20;
      if (a.x < margin) a.vx += 0.03;
      if (a.x > width - margin) a.vx -= 0.03;
      if (a.y < margin) a.vy += 0.03;
      if (a.y > height - margin) a.vy -= 0.03;

      // Exclusion rectangles (avoid overlapping text/content)
      for (const rect of exclusionRects) {
        if (rectContains(rect, a.x, a.y)) {
          // push node outwards from the nearest edge
          pushOutFromRect(a, rect);
        } else {
          // gentle repel when too close to rect edges
          const pad = 16;
          if (a.x > rect.left - pad && a.x < rect.right + pad && a.y > rect.top - pad && a.y < rect.bottom + pad) {
            pushAwayFromRectEdge(a, rect, pad);
          }
        }
      }

      // Friction + jitter
      a.vx *= FRICTION;
      a.vy *= FRICTION;
      a.vx += (Math.random() - 0.5) * BASE_JITTER;
      a.vy += (Math.random() - 0.5) * BASE_JITTER;

      // Move
      a.x += a.vx;
      a.y += a.vy;
    }
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Edges
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < CONNECT_DISTANCE) {
          let alpha = (1 - d / CONNECT_DISTANCE) * 0.22;
          if (a.group === b.group) alpha *= 1.4;
          if (mouse.active) {
            const mx = (a.x + b.x) * 0.5;
            const my = (a.y + b.y) * 0.5;
            const mdx = mx - mouse.x;
            const mdy = my - mouse.y;
            const md = Math.sqrt(mdx * mdx + mdy * mdy);
            if (md < MOUSE_RADIUS) alpha *= 0.35;
          }
          // skip drawing edges whose midpoint lies inside any exclusion rect
          const mx = (a.x + b.x) * 0.5;
          const my = (a.y + b.y) * 0.5;
          if (isPointInExclusion(mx, my)) continue;

          ctx.beginPath();
          ctx.strokeStyle = `rgba(40,40,40,${alpha})`;
          ctx.lineWidth = a.group === b.group ? 1 : 0.6;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Mouse field glow
    if (mouse.active) {
      const gradient = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        MOUSE_RADIUS
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0.06)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, MOUSE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    // Nodes
    for (const n of nodes) {
      // soft glow
      // skip nodes that are inside exclusion rects
      if (isPointInExclusion(n.x, n.y)) continue;

      ctx.beginPath();
      ctx.fillStyle = 'rgba(0,0,0,0.04)';
      ctx.arc(n.x, n.y, n.r + 3, 0, Math.PI * 2);
      ctx.fill();

      // actual node
      ctx.beginPath();
      ctx.fillStyle = colors[n.group];
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ========== Exclusion helpers ==========
  let exclusionRects = [];

  function computeExclusionRects() {
    const els = [document.querySelector('nav.site-nav'), document.querySelector('main'), document.querySelector('footer.site-footer')];
    exclusionRects = [];
    for (const el of els) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      exclusionRects.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
    }
  }

  function rectContains(rect, x, y) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function isPointInExclusion(x, y) {
    for (const rect of exclusionRects) if (rectContains(rect, x, y)) return true;
    return false;
  }

  function pushOutFromRect(node, rect) {
    // compute distances to each edge
    const dl = Math.abs(node.x - rect.left);
    const dr = Math.abs(rect.right - node.x);
    const dt = Math.abs(node.y - rect.top);
    const db = Math.abs(rect.bottom - node.y);
    const min = Math.min(dl, dr, dt, db);
    const strength = 0.9;
    if (min === dl) node.vx -= strength * (1 + (20 / Math.max(1, dl)));
    else if (min === dr) node.vx += strength * (1 + (20 / Math.max(1, dr)));
    else if (min === dt) node.vy -= strength * (1 + (20 / Math.max(1, dt)));
    else node.vy += strength * (1 + (20 / Math.max(1, db)));
  }

  function pushAwayFromRectEdge(node, rect, pad) {
    // push away gently when within pad distance
    const strength = 0.06;
    if (node.x < rect.left && node.x > rect.left - pad) node.vx -= strength * (1 - (rect.left - node.x) / pad) * 2;
    if (node.x > rect.right && node.x < rect.right + pad) node.vx += strength * (1 - (node.x - rect.right) / pad) * 2;
    if (node.y < rect.top && node.y > rect.top - pad) node.vy -= strength * (1 - (rect.top - node.y) / pad) * 2;
    if (node.y > rect.bottom && node.y < rect.bottom + pad) node.vy += strength * (1 - (node.y - rect.bottom) / pad) * 2;
  }

  // recompute exclusion rects on resize/scroll
  computeExclusionRects();
  window.addEventListener('resize', computeExclusionRects);
  window.addEventListener('scroll', computeExclusionRects);

  function animate() {
    update();
    render();
    requestAnimationFrame(animate);
  }

  animate();
})();
