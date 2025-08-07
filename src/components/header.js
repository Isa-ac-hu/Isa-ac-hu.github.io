// header.js
import {
  COLORS,
  LOGO,
  HEADER,
  polygonPoints,
  strokeRoundRect,
  easeLogistic,
  lerpHex,
  NAV_ANIM,
  RESUME_URL,
  convert,
  convertInt, getScale
} from '../utils.js';

export default class Header {
  onClick = e => {
    const r = this.canvas.getBoundingClientRect();
    const cssX = e.clientX - r.left;
    const cssY = e.clientY - r.top;
    /* Resume button opens the PDF */
    if (this.isResumeHit(cssX, cssY)) {
      return;
    }

    this.updateLinkBoxes();
    const idx = this.linkBoxes.findIndex(
      b => cssX >= b.left && cssX <= b.right &&
        cssY >= b.top  && cssY <= b.bottom
    );
    if (idx === -1) return; // nothing clicked
    const vh = window.innerHeight;
    // custom section start positions in multiples of vh
    const sectionOffsets = [
      /* About */ 1 * getScale(),
      /* Work */ 2 * getScale(),
      /* Projects */ 3 * getScale(),
      /* Travel */ 6.8 * getScale(),
    ];
    const targetY = sectionOffsets[idx] * vh;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };
    constructor(ctx, canvas) {
      this.ctx = ctx;
      this.canvas = canvas;
      this.hover = -1;
      this.hoverResume = false;

      this.resumeProg  = 0;
      this.SPEED = 0.08;
      this.links = [
        { num: '01.', label: 'About'},
        { num: '02.', label: 'Work'},
        { num: '03.', label: 'Projects'},
        { num: '04.', label: 'Travel'},
      ];
      this.linkProg = this.links.map(() => 0);
      /* fade-in of the mini-logo */
      this.logoProg = 0;
      this.FADE_SPEED = 0.05;

      this.navProg = 0;
      this.navDone = 1 + NAV_ANIM.stagger * (this.links.length - 1);

      /* hit-boxes are filled every draw so onClick can hit-test */
      this.linkBoxes  = this.links.map(() => ({}));
    }

    updateLinkBoxes() {
      const ctx   = this.ctx;
      const dpr = window.devicePixelRatio || 1;
      const cssW = this.canvas.width / dpr;
      const yMid = LOGO.anchor.y;
      ctx.font = HEADER.font;
      // measure each link
      const metrics = this.links.map(({ num, label }) => {
        const numW = ctx.measureText(num).width;
        const labelW = ctx.measureText(label).width;
        const totalW = HEADER.innerPad + numW + HEADER.numToLabel + labelW + HEADER.innerPad;
        return { totalW };
      });
      // total group width + gaps
      const contentW = metrics.reduce((sum, m) => sum + m.totalW, 0)
        + HEADER.gap * (this.links.length - 1);
      // starting X so group ends before resume button
      let x = cssW - HEADER.resumeW - contentW - HEADER.rightShift;
      // populate each hit box
      this.links.forEach((_, idx) => {
        const w = metrics[idx].totalW;
        this.linkBoxes[idx] = {
          left: x,
            right: x + w,
            top: yMid - HEADER.resumeH/2,
          bottom: yMid + HEADER.resumeH/2
        };
        x += w + HEADER.gap;
      });
    }
    /* call whenever you want the logo to fade-in again */
    resetFade() {
      this.logoProg = 0;
      this.navProg  = 0; }

    /* true if (cssX, cssY) is inside the Resume rounded-rect (CSS-px) */
    isResumeHit(cssX, cssY) {
      const dpr  = window.devicePixelRatio || 1;
      const cssW = this.canvas.width / dpr;
      const yMid = LOGO.anchor.y;

      const rx = cssW
        - HEADER.rightShift
        - HEADER.resumeW / 2
        + HEADER.resumeDistance;

      const left = rx - HEADER.resumeW / 2;
      const right = rx + HEADER.resumeW / 2;
      const top = yMid - HEADER.resumeH / 2;
      const bottom = yMid + HEADER.resumeH / 2;
      return cssX >= left && cssX <= right && cssY >= top && cssY <= bottom;
    }

    /* alpha lets HomeStage fade‑in the logo */
    draw() {
      if (this.canvas.style.display === 'none') return;
      const { ctx, canvas } = this;
      this.updateLinkBoxes();
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.width / dpr;
      const cssH = canvas.height / dpr;

      /* advance fade */
      if (this.logoProg < 1) this.logoProg =
        Math.min(1, this.logoProg + this.FADE_SPEED);
      const alpha = easeLogistic(this.logoProg);
      /* start / continue nav timer once logo is visible */
      if (this.logoProg >= 1 && this.navProg < this.navDone)
        this.navProg = Math.min(this.navDone, this.navProg + NAV_ANIM.speed);

      ctx.save();
      ctx.translate(HEADER.offsetX, HEADER.offsetY);

        /* mini‑logo (left) */
        ctx.save();
        ctx.translate(LOGO.anchor.x, LOGO.anchor.y);
        ctx.globalAlpha = alpha;

        const r = Math.min(window.innerWidth, window.innerHeight) * LOGO.scale;
        ctx.lineWidth = 3;
        ctx.strokeStyle = COLORS.cyan;
        ctx.beginPath();
        polygonPoints(r).forEach(([x, y], i) =>
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
        );
        ctx.closePath(); ctx.stroke();

        ctx.fillStyle = COLORS.cyan;
        ctx.font = 'bold ' + '20px "SF Mono Regular", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('胡', 0, 0);
        ctx.restore();

        /* right‑hand nav links */
        ctx.font = HEADER.font;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';

        const y = LOGO.anchor.y;
        const innerPad = HEADER.innerPad;
        const numToLabel = HEADER.numToLabel;

        /*  measure each link’s real width  */
        const metrics = this.links.map(({ num, label }) => {
          const numW = ctx.measureText(num   ).width;
          const labelW = ctx.measureText(label ).width;
          /* hit‑box width = left‑pad + num + gap + label + right‑pad */
          const totalW = innerPad + numW + numToLabel + labelW + innerPad;
          return { numW, labelW, totalW };
        });

        /* total width of the whole group */
        const contentW = metrics.reduce((sum, m) => sum + m.totalW, 0) + HEADER.gap * (this.links.length - 1);

        /*  starting x so that the group ends just before the Resume button */
        let x = cssW - HEADER.resumeW - contentW - HEADER.rightShift;

        /* draw each item & advance x */
        this.links.forEach(({ num, label }, idx) => {
          const { numW, totalW } = metrics[idx];

          /* drop-in progression (delay per index) */
          const tRaw = this.navProg - idx * NAV_ANIM.stagger; // may be <0
          const t = Math.max(0, Math.min(1, tRaw));
          const easeT = easeLogistic(t);
          const dropY = -NAV_ANIM.dropPx * (1 - easeT);
          ctx.globalAlpha = easeT;
          ctx.save();
          ctx.translate(0, dropY);

          /* progress update for this link */
          if (idx === this.hover)
            this.linkProg[idx] = Math.min(1, this.linkProg[idx] + this.SPEED);
          else
            this.linkProg[idx] = Math.max(0, this.linkProg[idx] - this.SPEED);

          const hoverT = easeLogistic(this.linkProg[idx]);
          const color  = lerpHex('#CCD6F6', '#64FFDA', hoverT);

          /* draw number + label  */
          ctx.fillStyle = COLORS.cyan;
          ctx.fillText(num, x + innerPad, y);
          ctx.fillStyle = color;
          ctx.fillText(label, x + innerPad + numW + numToLabel, y)

          /* save hit-box for onClick / updateHover */
          const yMid = y + dropY;
          this.linkBoxes[idx] = {
            left  : x,
            right : x + totalW,
            top   : yMid - HEADER.resumeH / 2,
            bottom: yMid + HEADER.resumeH / 2
          };
          /* advance to next slot (box + gap) */
          x += totalW + HEADER.gap;

          ctx.restore();
        });

        /* Resume button */
        const rx = cssW - HEADER.rightShift - HEADER.resumeW / 2 + HEADER.resumeDistance;
        const ry = y;

        /* fade calculation */
        if (this.hoverResume) this.resumeProg = Math.min(1, this.resumeProg + this.SPEED);
        else this.resumeProg = Math.max(0, this.resumeProg - this.SPEED);
        const rT = easeLogistic(this.resumeProg);
        const alpha2 = 0.25 * rT;
        if (alpha2 > 0.005) {
            ctx.fillStyle = `rgba(100,255,218,${alpha2})`;
            ctx.fillRect(rx - HEADER.resumeW / 2,
                ry - HEADER.resumeH / 2,
                HEADER.resumeW, HEADER.resumeH);
        }

        ctx.lineWidth = 1;
        ctx.strokeStyle = COLORS.cyan;
        strokeRoundRect(
          ctx,
          rx - HEADER.resumeW / 2,
          ry - HEADER.resumeH / 2,
          HEADER.resumeW,
          HEADER.resumeH,
          HEADER.resumeRadius
        );

        ctx.fillStyle = COLORS.cyan;
        ctx.textAlign = 'center';
        ctx.fillText('Resume', rx, ry);
        ctx.restore();
    }

  /*
   * Mouse‑move helper – store which link (if any) is under the cursor.
   * Returns true ↔ pointer is over a link, so HomeStage can switch the cursor.
   */
    updateHover(cssX, cssY) {
        const { canvas } = this;
        const dpr = window.devicePixelRatio || 1;
        const cssW = canvas.width  / dpr; // real visual width in CSS px
        const cssH = canvas.height / dpr;

    this.updateLinkBoxes();
        const ctx = this.ctx;
        ctx.font = HEADER.font;

        const yMid = LOGO.anchor.y;
        const hitH = HEADER.resumeH;

        // running x position of the start of each link
        const metrics = this.links.map(({ num, label }) => {
          const numW = ctx.measureText(num  ).width;
          const labelW = ctx.measureText(label).width;
          const totalW = HEADER.innerPad + numW + HEADER.numToLabel + labelW + HEADER.innerPad;
          return { totalW };
        });
        const contentW = metrics.reduce((s, m) => s + m.totalW, 0)
            + HEADER.gap * (this.links.length - 1);
        let x = cssW - HEADER.resumeW - contentW - HEADER.rightShift;

        /* reset hover each call */
        this.hover = -1;
        this.hoverResume  = this.isResumeHit(cssX, cssY);

        metrics.forEach((m, idx) => {
          const stripStart = x; // skip left padding
          const stripEnd = x + m.totalW; // no right padding
          const by = yMid - hitH / 2;

          if (cssX >= stripStart && cssX <= stripEnd &&
            cssY >= by && cssY <= by + hitH) {
            this.hover = idx;
          }
          // advance to next slot: full padded box + gap
          x += m.totalW + HEADER.gap;
        });
        return this.hover !== -1 || this.hoverResume;
    }
}


