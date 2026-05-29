/* ============================================================
   Research project card animations
   One themed canvas animation per project — all contained
   within the 16/9 cover-img bounds.
   Pure vanilla JS / Canvas, no dependencies.
   ============================================================ */

(function () {
  const css = getComputedStyle(document.documentElement);
  const COLOR_A = css.getPropertyValue('--accent').trim()   || '#7d2828';
  const COLOR_B = css.getPropertyValue('--accent-2').trim() || '#2d4a6b';

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c+c).join('') : h;
    return [parseInt(full.slice(0,2),16), parseInt(full.slice(2,4),16), parseInt(full.slice(4,6),16)];
  }

  function initCanvas(id) {
    const canvas = document.getElementById(id);
    if (!canvas) return null;
    const DPR = window.devicePixelRatio || 1;
    const W = canvas.clientWidth  || 400;
    const H = canvas.clientHeight || 225;
    canvas.width  = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    const ctx = canvas.getContext('2d');
    ctx.scale(DPR, DPR);
    return { canvas, ctx, W, H };
  }

  /* ----------------------------------------------------------
     1. Czech schools — classroom seating with animated ties
        Students sit in a 7×3 grid; a blackboard sits at top.
        Friendship edges pulse between classmates — within-group
        ties appear more frequently (homophily).
     ---------------------------------------------------------- */
  function initCzechSchools() {
    const r = initCanvas('anim-czech-schools');
    if (!r) return;
    const { ctx, W, H } = r;

    const PAD      = 10;
    const BOARD_H  = Math.round(H * 0.22);
    const ROWS = 3, COLS = 7;
    const SEAT_Y0  = BOARD_H + 9;
    const CW = (W - 2 * PAD) / COLS;   // cell width
    const CH = (H - SEAT_Y0 - PAD) / ROWS; // cell height
    const NR = Math.min(CW, CH) * 0.23;    // node radius
    const DESK_W = CW * 0.50, DESK_H = CH * 0.16;

    // Assign groups (~45% / 55%), then shuffle seats
    const N = ROWS * COLS;
    const grps = Array.from({ length: N }, (_, i) => i < Math.round(N * 0.45) ? 0 : 1);
    for (let i = N - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [grps[i], grps[j]] = [grps[j], grps[i]];
    }
    const students = grps.map((group, idx) => ({
      x: PAD + ((idx % COLS) + 0.5) * CW,
      y: SEAT_Y0 + (Math.floor(idx / COLS) + 0.38) * CH,
      group,
      phase: Math.random() * Math.PI * 2,
    }));

    // Edges: pairs within 2.6 cells; animated alpha oscillates
    const MAX_D = Math.sqrt((CW * 2.6) ** 2 + (CH * 1.4) ** 2);
    const edges = [];
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const a = students[i], b = students[j];
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        if (d > MAX_D) continue;
        const sameGroup = a.group === b.group;
        edges.push({
          i, j, sameGroup,
          phase: Math.random() * Math.PI * 2,
          speed: 0.006 + Math.random() * 0.004,
          // same-group: oscillates around 0.45 with amp 0.20 → always visible
          // cross-group: oscillates around 0.02 with amp 0.10 → briefly visible
          mean: sameGroup ? 0.42 : 0.025,
          amp:  sameGroup ? 0.20 : 0.090,
        });
      }
    }

    // Blackboard mini-network geometry (scaled to board area)
    const BX  = PAD + 16;             // left edge of mini network
    const BY  = BOARD_H * 0.50;       // vertical center on board
    const CR  = BOARD_H * 0.21;       // cluster radius

    // Three Group-A nodes in a triangle, two Group-B nodes
    const MINI_A = [
      [BX,           BY - CR * 0.65],
      [BX - CR * 0.7, BY + CR * 0.42],
      [BX + CR * 0.7, BY + CR * 0.42],
    ];
    const MINI_B = [
      [BX + CR * 2.7, BY - CR * 0.48],
      [BX + CR * 2.7, BY + CR * 0.48],
    ];

    let tick = 0;

    function drawBlackboard() {
      // Board fill
      ctx.fillStyle = '#1b2e1b';
      ctx.fillRect(PAD, 4, W - 2 * PAD, BOARD_H - 4);
      ctx.strokeStyle = 'rgba(200,195,175,0.20)';
      ctx.lineWidth = 1;
      ctx.strokeRect(PAD, 4, W - 2 * PAD, BOARD_H - 4);

      const chalk = a => `rgba(215,208,188,${a})`;

      // Dense intra-A edges
      ctx.strokeStyle = chalk(0.52);
      ctx.lineWidth = 0.9;
      for (let i = 0; i < MINI_A.length; i++)
        for (let j = i + 1; j < MINI_A.length; j++) {
          ctx.beginPath();
          ctx.moveTo(MINI_A[i][0], MINI_A[i][1]);
          ctx.lineTo(MINI_A[j][0], MINI_A[j][1]);
          ctx.stroke();
        }
      // Intra-B edge
      ctx.beginPath();
      ctx.moveTo(MINI_B[0][0], MINI_B[0][1]);
      ctx.lineTo(MINI_B[1][0], MINI_B[1][1]);
      ctx.stroke();

      // Faint cross-group edge
      ctx.strokeStyle = chalk(0.16);
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(MINI_A[0][0] + CR * 0.5, MINI_A[0][1] + 2);
      ctx.lineTo(MINI_B[0][0] - 2, MINI_B[0][1]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Nodes
      MINI_A.concat(MINI_B).forEach(([x, y]) => {
        ctx.fillStyle = chalk(0.60);
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // "contact?" label
      ctx.fillStyle = chalk(0.38);
      ctx.font = `italic ${Math.max(7, Math.round(BOARD_H * 0.27))}px serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('Are school segregated?', W - PAD - 8, BOARD_H * 0.50);
    }

    function step() {
      tick++;
      ctx.clearRect(0, 0, W, H);

      drawBlackboard();

      // Desk surfaces
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const cx = PAD + (col + 0.5) * CW;
          const cy = SEAT_Y0 + (row + 0.38) * CH;
          ctx.fillStyle = 'rgba(165,140,110,0.28)';
          ctx.fillRect(cx - DESK_W / 2, cy + NR + 2, DESK_W, DESK_H);
        }
      }

      // Friendship edges
      for (const e of edges) {
        const a = students[e.i], b = students[e.j];
        const alpha = e.mean + e.amp * Math.sin(tick * e.speed + e.phase);
        if (alpha < 0.02) continue;
        ctx.lineWidth = e.sameGroup ? 1.1 : 0.6;
        ctx.strokeStyle = e.sameGroup
          ? (students[e.i].group === 0
              ? `rgba(125,40,40,${alpha})`
              : `rgba(45,74,107,${alpha})`)
          : `rgba(80,80,80,${alpha * 0.6})`;
        const bobA = Math.sin(tick * 0.025 + a.phase) * 0.5;
        const bobB = Math.sin(tick * 0.025 + b.phase) * 0.5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y + bobA);
        ctx.lineTo(b.x, b.y + bobB);
        ctx.stroke();
      }

      // Students (gently bob at their seats)
      for (const s of students) {
        const bob = Math.sin(tick * 0.025 + s.phase) * 0.5;
        ctx.fillStyle = s.group === 0 ? COLOR_A : COLOR_B;
        ctx.beginPath();
        ctx.arc(s.x, s.y + bob, NR, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(step);
    }
    step();
  }

  /* ----------------------------------------------------------
     2. Fairness rankings — urn model with shuffle & slow draw
        Balls float inside a drawn urn.
        State: IDLE → SHAKE (urn oscillates) → FLYING (one ball
        arcs over the opening to its rank slot, slow ease) → IDLE.
        When all ranks filled, brief pause then reset.
     ---------------------------------------------------------- */
  function initFairnessRankings() {
    const r = initCanvas('anim-fairness');
    if (!r) return;
    const { ctx, W, H } = r;

    // Urn geometry
    const CX   = W * 0.27;
    const TOP  = H * 0.05;
    const BOT  = H * 0.94;
    const URNH = BOT - TOP;
    const NRX  = W * 0.088;   // neck half-width
    const BRX  = W * 0.175;   // body half-width

    // Physics ellipse (approximates urn interior)
    const ECX = CX, ECY = TOP + URNH * 0.53;
    const ERX = BRX * 0.78,   ERY = URNH * 0.40;

    // Rank list
    const RANK_CX   = W * 0.80;
    const MAX_RANKS = 6;
    const getRankY  = i => H / 2 + (i - (MAX_RANKS - 1) / 2) * H * 0.115;

    // Balls
    const MAJ = 10, MIN = 5;
    const balls = Array.from({ length: MAJ + MIN }, (_, i) => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      r: i >= MAJ ? 5 : 7.5,
      color: i >= MAJ ? COLOR_B : COLOR_A,
      minority: i >= MAJ,
      inUrn: true,
      flying: false,
      fromX: 0, fromY: 0, toX: 0, toY: 0, flyT: 0,
    }));
    const ranked  = [];

    const STILL_FRAMES = 90;
    const SHUFFLE_FRAMES = 160;
    const POST_DRAW_PAUSE = 18;
    const DRAW_FLIGHT_STEP = 0.009;
    const DRAW_FLIGHT_LAG = 0;

    function randomPointInUrn(padding = 0) {
      for (let attempt = 0; attempt < 60; attempt++) {
        const x = ECX + (Math.random() * 2 - 1) * (ERX - padding);
        const y = ECY + (Math.random() * 2 - 1) * (ERY - padding);
        const dx = x - ECX;
        const dy = y - ECY;
        const inside = (dx * dx) / ((ERX - padding) ** 2) + (dy * dy) / ((ERY - padding) ** 2);
        if (inside <= 1) return { x, y };
      }
      return { x: ECX, y: ECY };
    }

    function placeBallsSpreadOut() {
      const placed = [];
      for (const b of balls) {
        let spot = null;
        for (let attempt = 0; attempt < 300; attempt++) {
          const candidate = randomPointInUrn(10 + b.r);
          const ok = placed.every(other => {
            const dx = candidate.x - other.x;
            const dy = candidate.y - other.y;
            const minDist = (b.r + other.r) * 1.55;
            return dx * dx + dy * dy > minDist * minDist;
          });
          if (ok) {
            spot = candidate;
            break;
          }
        }
        if (!spot) spot = randomPointInUrn(8 + b.r * 0.4);
        b.x = spot.x;
        b.y = spot.y;
        b.vx = (Math.random() - 0.5) * 0.04;
        b.vy = (Math.random() - 0.5) * 0.04;
        placed.push(b);
      }
    }

    placeBallsSpreadOut();

    // State machine
    let state      = 'idle';   // 'idle' | 'shuffle' | 'flying' | 'between' | 'pause'
    let stateTimer = STILL_FRAMES;
    let shuffleFrame = 0;
    let shuffleDir = 1;
    let shakeOff   = 0;
    let drawPause   = 0;

    function constrainToUrn(b) {
      const dx = b.x - ECX, dy = b.y - ECY;
      const nd = Math.sqrt((dx / ERX) ** 2 + (dy / ERY) ** 2);
      if (nd > 0.95) {
        const scale = 0.88 / nd; //0.88 / nd;
        b.x = ECX + dx * scale;
        b.y = ECY + dy * scale;
        const nx = (dx / (ERX * ERX)), ny = (dy / (ERY * ERY));
        const nl = Math.sqrt(nx * nx + ny * ny);
        const nnx = nx / nl, nny = ny / nl;
        const dot = b.vx * nnx + b.vy * nny;
        if (dot > 0) {
          b.vx -= 2 * dot * nnx;
          b.vy -= 2 * dot * nny;
          b.vx *= 0.50; b.vy *= 0.50;
        }
      }
    }

    function easeInOut(t) {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    function selectBall() {
      const avail = balls.filter(b => b.inUrn);
      if (avail.length === 0 || ranked.length >= MAX_RANKS) {
        state = 'pause'; stateTimer = 70;
        return;
      }
      const ball = avail[Math.floor(Math.random() * avail.length)];
      ball.inUrn = false;
      ball.flying = true;
      ball.flyT   = 0;
      ball.fromX  = ball.x;
      ball.fromY  = ball.y;
      ball.toX    = RANK_CX;
      ball.toY    = getRankY(ranked.length);
      ranked.push(ball);
      state = 'flying';
    }

    function resetBalls() {
      ranked.length = 0;
      balls.forEach(b => {
        b.inUrn = true;
        b.flying = false;
        b.flyT = 0;
      });
      placeBallsSpreadOut();
      state = 'idle';
      stateTimer = STILL_FRAMES;
      shuffleFrame = 0;
      drawPause = 0;
    }

    function startShuffle() {
      state = 'shuffle';
      shuffleFrame = 0;
      shuffleDir = Math.random() < 0.5 ? 1 : -1;
      for (const b of balls) {
        b.vx *= 0.15;
        b.vy *= 0.15;
      }
    }

    // Draw the urn outline path at horizontal offset ox
    function urnPath(ox) {
      const cx = CX + ox;
      ctx.beginPath();
      ctx.moveTo(cx - NRX, TOP);
      // Left: neck down to body, then sweep to bottom
      ctx.bezierCurveTo(cx - NRX, TOP + URNH*0.20, cx - BRX, TOP + URNH*0.38, cx - BRX, TOP + URNH*0.65);
      ctx.bezierCurveTo(cx - BRX, TOP + URNH*0.88, cx - BRX*0.50, BOT, cx, BOT);
      // Right: bottom up to body, neck
      ctx.bezierCurveTo(cx + BRX*0.50, BOT, cx + BRX, TOP + URNH*0.88, cx + BRX, TOP + URNH*0.65);
      ctx.bezierCurveTo(cx + BRX, TOP + URNH*0.38, cx + NRX, TOP + URNH*0.20, cx + NRX, TOP);
      ctx.closePath();
    }

    function step() {
      // State transitions
      if (state === 'idle') {
        if (--stateTimer <= 0) { startShuffle(); }

      } else if (state === 'shuffle') {
        shuffleFrame++;
        const t = shuffleFrame / SHUFFLE_FRAMES;
        const burst = Math.max(0, 1 - t);
        const wobble = 7 * burst * Math.sin(shuffleFrame * 0.08);
        shakeOff = wobble;

        for (const b of balls) {
          const dx = b.x - ECX;
          const dy = b.y - ECY;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          const tangential = shuffleDir * (0.05 + 0.04 * burst);
          b.vx += (-dy / d) * tangential;
          b.vy += ( dx / d) * tangential;
          b.vx += (Math.random() - 0.5) * 0.05 * burst;
          b.vy += (Math.random() - 0.5) * 0.05 * burst;
        }

        if (shuffleFrame >= SHUFFLE_FRAMES) {
          for (const b of balls) {
            b.vx *= 0.2;
            b.vy *= 0.2;
          }
          drawPause = 10;
          selectBall();
        }

      } else if (state === 'flying') {
        // Completion checked in physics block below

      } else if (state === 'between') {
        if (--drawPause <= 0) {
          selectBall();
        }

      } else if (state === 'pause') {
        if (--stateTimer <= 0) {
          resetBalls();
        }
      }

      // Physics: balls inside urn
      for (const b of balls) {
        if (!b.inUrn) continue;
        const centerPull = state === 'shuffle' ? 0.00020 : 0;
        const jitter = state === 'shuffle' ? 0.050 : 0.004;
        b.vx += (ECX - b.x) * centerPull + (Math.random() - 0.5) * jitter;
        b.vy += (ECY + ERY * 0.08 - b.y) * centerPull + (Math.random() - 0.5) * jitter;
        b.vx *= state === 'shuffle' ? 0.955 : 0.992;
        b.vy *= state === 'shuffle' ? 0.955 : 0.992;
        b.x += b.vx;
        b.y += b.vy;
        constrainToUrn(b);
      }

      // Flying ball animation
      for (const b of balls) {
        if (!b.flying) continue;
        b.flyT = Math.min(1, b.flyT + DRAW_FLIGHT_STEP);
        const t = easeInOut(b.flyT);
        // Quadratic bezier arc: rises above urn, then swoops to rank slot
        const ctrlY = TOP - H * 0.12;
        b.x = b.fromX + (b.toX - b.fromX) * t;
        b.y = (1 - t) * (1 - t) * b.fromY + 2 * (1 - t) * t * ctrlY + t * t * b.toY;
        if (b.flyT >= 1) {
          b.flying = false;
          if (ranked.length >= MAX_RANKS) {
            state = 'pause';
            stateTimer = 75;
          } else {
            state = 'between';
            drawPause = POST_DRAW_PAUSE;
          }
        }
      }

      ctx.clearRect(0, 0, W, H);

      // --- Draw urn interior (clipped) ---
      ctx.save();
      urnPath(shakeOff);
      ctx.fillStyle = 'rgba(232,226,218,0.90)';
      ctx.fill();
      ctx.clip();

      for (const b of balls) {
        if (!b.inUrn) continue;
        ctx.globalAlpha = 0.90;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x + shakeOff, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // Urn stroke on top (makes balls look inside)
      urnPath(shakeOff);
      ctx.strokeStyle = 'rgba(0,0,0,0.28)';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Opening rim
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(CX + shakeOff - NRX - 3, TOP);
      ctx.lineTo(CX + shakeOff + NRX + 3, TOP);
      ctx.stroke();

      // Flying ball (above urn)
      for (const b of balls) {
        if (!b.flying) continue;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Rank slots
      const fontSize = Math.max(7, Math.round(H / 22));
      ctx.font = fontSize + 'px IBM Plex Sans, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      for (let i = 0; i < MAX_RANKS; i++) {
        const sy = getRankY(i);
        ctx.strokeStyle = 'rgba(0,0,0,0.13)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(RANK_CX, sy, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillText(i + 1, RANK_CX + 11, sy);
      }

      // Ranked balls (settled)
      for (const b of ranked) {
        if (b.flying) continue;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.toX, b.toY, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(step);
    }
    step();
  }

  /* ----------------------------------------------------------
     3. Intersectional inequalities — 4-group network
        Nodes have 2 binary attributes. Homophily scales with
        shared attributes. Majority [0,0] has centroid cohesion
        → clusters in the center. Double-minority [1,1] has no
        cohesion + mild anti-center drift → isolated at edges.
     ---------------------------------------------------------- */
  function initIntersectionalInequalities() {
    const r = initCanvas('anim-intersectional');
    if (!r) return;
    const { ctx, W, H } = r;

    const GROUP_COLORS = [
      '#7d2828',
      '#c26f2c',
      '#2d4a6b',
      '#2f7a72',
    ];

    // [0,0]=majority(25), [0,1]=partial(10), [1,0]=partial(8), [1,1]=double-minority(6)
    const COUNTS    = [25, 10, 8, 6];
    const REPULSION = 0.013;
    const FRICTION  = 0.93;
    const JITTER    = 0.010;
    const CONNECT   = 65;

    // Cohesion strength per group: [0,0] tight, [0,1]/[1,0] slight, [1,1] none
    const COHESION  = [0.00065, 0.00010, 0.00010, 0];
    // Anti-center drift for [1,1]
    const DRIFT     = 0.014;

    const nodes = [];
    for (let g = 0; g < 4; g++) {
      for (let k = 0; k < COUNTS[g]; k++) {
        // Majority starts near center; double-minority starts at periphery
        let x, y;
        if (g === 0) {
          x = W * 0.28 + Math.random() * W * 0.44;
          y = H * 0.22 + Math.random() * H * 0.56;
        } else if (g === 3) {
          // Scatter to edges
          if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 12 + Math.random() * W * 0.18 : W - 12 - Math.random() * W * 0.18;
            y = 12 + Math.random() * (H - 24);
          } else {
            x = 12 + Math.random() * (W - 24);
            y = Math.random() < 0.5 ? 12 + Math.random() * H * 0.20 : H - 12 - Math.random() * H * 0.20;
          }
        } else {
          x = 12 + Math.random() * (W - 24);
          y = 12 + Math.random() * (H - 24);
        }
        nodes.push({
          x, y,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          g, a: g >> 1, b: g & 1,
          r: g === 3 ? 2.8 : (2.2 + Math.random()),
        });
      }
    }

    function sharedAttrs(n1, n2) {
      return (n1.a === n2.a ? 1 : 0) + (n1.b === n2.b ? 1 : 0);
    }

    const N = nodes.length;

    function step() {
      // Compute group centroids (for cohesion force)
      const centroids = Array.from({ length: 4 }, (_, g) => {
        const grp = nodes.filter(n => n.g === g);
        if (!grp.length) return null;
        return {
          x: grp.reduce((s, n) => s + n.x, 0) / grp.length,
          y: grp.reduce((s, n) => s + n.y, 0) / grp.length,
        };
      });

      for (let i = 0; i < N; i++) {
        const a = nodes[i];

        // Pair-wise: shared-attribute homophily + short-range repulsion
        for (let j = 0; j < N; j++) {
          if (i === j) continue;
          const b = nodes[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 1) continue;
          const d  = Math.sqrt(d2);
          const sh = sharedAttrs(a, b);
          if (sh > 0 && d > 20 && d < 100) {
            const pull = sh === 2 ? 0.00050 : 0.00012;
            a.vx += (dx / d) * pull;
            a.vy += (dy / d) * pull;
          }
          if (d < 16) {
            a.vx -= (dx / d) * REPULSION;
            a.vy -= (dy / d) * REPULSION;
          }
        }

        // Centroid cohesion (groups 0–2 only)
        const coh = COHESION[a.g];
        if (coh > 0 && centroids[a.g]) {
          a.vx += (centroids[a.g].x - a.x) * coh;
          a.vy += (centroids[a.g].y - a.y) * coh;
        }

        // Double-minority: drift away from canvas center
        if (a.g === 3) {
          const dx = a.x - W / 2, dy = a.y - H / 2;
          const d  = Math.sqrt(dx * dx + dy * dy) || 1;
          a.vx += (dx / d) * DRIFT;
          a.vy += (dy / d) * DRIFT;
        }

        // Hard walls
        if (a.x <  10) a.vx += 0.07;
        if (a.x > W - 10) a.vx -= 0.07;
        if (a.y <  10) a.vy += 0.07;
        if (a.y > H - 10) a.vy -= 0.07;

        a.vx = a.vx * FRICTION + (Math.random() - 0.5) * JITTER;
        a.vy = a.vy * FRICTION + (Math.random() - 0.5) * JITTER;
        a.x += a.vx;
        a.y += a.vy;
      }

      ctx.clearRect(0, 0, W, H);

      // Edges: alpha proportional to shared attributes
      ctx.lineWidth = 0.6;
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(b.x - a.x, b.y - a.y);
          if (d >= CONNECT) continue;
          const sh = sharedAttrs(a, b);
          const alpha = (1 - d / CONNECT) * (sh === 2 ? 0.40 : sh === 1 ? 0.13 : 0.03);
          ctx.strokeStyle = 'rgba(60,60,60,' + alpha + ')';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // Nodes: color blend by group; double-minority dimmer
      for (const n of nodes) {
        const opacity = n.g === 3 ? 0.55 : 0.90;
        ctx.fillStyle = GROUP_COLORS[n.g] + Math.round(opacity * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(step);
    }
    step();
  }

  /* ----------------------------------------------------------
     4. Traffic networks — particle flow on road grid
        Cars flow along a 4×3 grid of road segments.
        Traffic lights at intersections cycle red/green.
        Cars queue behind red lights and flow on green.
     ---------------------------------------------------------- */
  function initTrafficNetworks() {
    const r = initCanvas('anim-traffic');
    if (!r) return;
    const { ctx, W, H } = r;

    const COLS = 4, ROWS = 3;
    const PAD  = 22;
    const xs = Array.from({ length: COLS }, (_, i) => PAD + i * (W - 2 * PAD) / (COLS - 1));
    const ys = Array.from({ length: ROWS }, (_, i) => PAD + i * (H - 2 * PAD) / (ROWS - 1));

    const intersections = [];
    for (let row = 0; row < ROWS; row++)
      for (let col = 0; col < COLS; col++)
        intersections.push({ x: xs[col], y: ys[row], phase: Math.random() * 200 });

    const segs = [];
    for (let row = 0; row < ROWS; row++)
      for (let col = 0; col < COLS - 1; col++)
        segs.push([row * COLS + col, row * COLS + col + 1]);
    for (let col = 0; col < COLS; col++)
      for (let row = 0; row < ROWS - 1; row++)
        segs.push([row * COLS + col, (row + 1) * COLS + col]);

    const adj = Array.from({ length: COLS * ROWS }, () => []);
    for (const [a, b] of segs) { adj[a].push(b); adj[b].push(a); }

    const NUM_CARS = 16, PHASE_LEN = 150;
    function newCar(i) {
      const [fromI, toI] = segs[Math.floor(Math.random() * segs.length)];
      return { fromI, toI, t: Math.random(), speed: 0.0038 + Math.random() * 0.003, color: i % 4 === 0 ? COLOR_B : COLOR_A };
    }
    const cars = Array.from({ length: NUM_CARS }, (_, i) => newCar(i));
    let tick = 0;

    function isRed(idx, t) {
      return ((t + intersections[idx].phase) % PHASE_LEN) < PHASE_LEN / 2;
    }

    function step() {
      tick++;
      for (const car of cars) {
        const destRed = isRed(car.toI, tick);
        if (!(car.t > 0.88 && destRed)) car.t += car.speed;
        if (car.t >= 1) {
          car.fromI = car.toI;
          const nb = adj[car.fromI];
          car.toI  = nb[Math.floor(Math.random() * nb.length)];
          car.t    = 0;
          car.speed = 0.0038 + Math.random() * 0.003;
        }
      }

      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(0,0,0,0.13)';
      ctx.lineWidth   = 3.5;
      for (const [ai, bi] of segs) {
        const a = intersections[ai], b = intersections[bi];
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      for (let i = 0; i < intersections.length; i++) {
        const inter = intersections[i];
        ctx.fillStyle = isRed(i, tick) ? 'rgba(180,40,40,0.9)' : 'rgba(30,150,55,0.9)';
        ctx.beginPath(); ctx.arc(inter.x, inter.y, 4, 0, Math.PI * 2); ctx.fill();
      }
      for (const car of cars) {
        const from = intersections[car.fromI], to = intersections[car.toI];
        ctx.fillStyle   = car.color;
        ctx.globalAlpha = 0.88;
        ctx.beginPath();
        ctx.arc(from.x + (to.x - from.x) * car.t, from.y + (to.y - from.y) * car.t, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      requestAnimationFrame(step);
    }
    step();
  }

  /* ----------------------------------------------------------
     5. Electricity forecasting — scrolling correlated time series
        Six sine-based waves (one per ISO New England sub-region)
        scrolling left to right, correlated with slight phase offsets.
     ---------------------------------------------------------- */
  function initElectricityForecasting() {
    const r = initCanvas('anim-electricity');
    if (!r) return;
    const { ctx, W, H } = r;

    const NUM_SERIES = 6, PAD = 14, SPEED = 0.55;
    const plotH = H - 2 * PAD;
    const [rA, gA, bA] = hexToRgb(COLOR_A);
    const [rB, gB, bB] = hexToRgb(COLOR_B);

    function seriesColor(i, alpha) {
      const t = i / (NUM_SERIES - 1);
      return 'rgba(' + Math.round(rA+(rB-rA)*t) + ',' + Math.round(gA+(gB-gA)*t) + ',' + Math.round(bA+(bB-bA)*t) + ',' + alpha + ')';
    }

    const series = Array.from({ length: NUM_SERIES }, (_, i) => ({
      phaseOff:   (i / NUM_SERIES) * Math.PI * 1.8,
      ampScale:   0.18 + (i % 3) * 0.05,
      vertCenter: PAD + (plotH * (i + 0.5)) / NUM_SERIES,
      bandwidth:  plotH / NUM_SERIES * 0.42,
    }));

    let offset = 0;
    function seriesY(s, px) {
      const t = (px + offset) * 0.013;
      const v = Math.sin(t + s.phaseOff) * s.ampScale
              + Math.sin(t * 2.1 + s.phaseOff * 1.4) * s.ampScale * 0.45
              + Math.sin(t * 0.4 + s.phaseOff * 0.7) * s.ampScale * 0.6;
      return s.vertCenter + v * s.bandwidth / s.ampScale;
    }

    function step() {
      offset += SPEED;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(0,0,0,0.05)';
      ctx.lineWidth = 1;
      for (let i = 1; i < NUM_SERIES; i++) {
        const y = PAD + (plotH * i) / NUM_SERIES;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      for (let si = 0; si < NUM_SERIES; si++) {
        const s = series[si];
        ctx.beginPath();
        ctx.strokeStyle = seriesColor(si, 0.72);
        ctx.lineWidth = 1.6;
        for (let px = 0; px <= W; px += 2) {
          const y = seriesY(s, px);
          px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
        }
        ctx.stroke();
      }
      requestAnimationFrame(step);
    }
    step();
  }

  // Boot all animations once layout is settled
  window.addEventListener('load', function () {
    initCzechSchools();
    initFairnessRankings();
    initIntersectionalInequalities();
    initTrafficNetworks();
    initElectricityForecasting();
  });

})();
