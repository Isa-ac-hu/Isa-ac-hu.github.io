/* src/components/workCanvas.js ------------------------------------ */
import {
  COLORS, WORK, JOBS, BULLET, strokeRoundRect,
  easeLogistic, WORK_ANIM
} from '../utils.js';

function wrapLine(ctx, text, x, y, maxW, lineH) {
  const words = text.split(/\s+/);
  let line = '', cy = y;
  words.forEach((w, i) => {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW) {
      ctx.fillText(line, x, cy);
      line = w;
      cy  += lineH;
    } else {
      line = test;
    }
    if (i === words.length - 1) ctx.fillText(line, x, cy);
  });
  return cy + lineH;          // where the caller should keep drawing
}

const drawBullet = (ctx, x, y, size = 3, color = COLORS.cyan) => {
  ctx.strokeStyle = color;
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(x,           y + size * .1);
  ctx.lineTo(x + size,     y + size * .5);
  ctx.lineTo(x,           y + size * .9);
  ctx.closePath();
  ctx.stroke();
};
const SMALL_PAD = 30;       // indent for inner bullets
const bulletPad = 20;

export default class WorkCanvas {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;

    this.compLink = { x:0, y:0, w:0, h:0, prog:0, hover:false };

    this.sel = 0;            // selected job index
    this.hover = -1;           // hover index (-1 = none)
    this.barProg = 0;            // 0‒1 bar transition
    this.barY     = 0;            // current bar-top (px, canvas coords)
    this.pageY    = 0;            // saved every draw() for hit-tests

    canvas.addEventListener('mousemove', this.onMove);
    canvas.addEventListener('click', this.onClick);
  }

  /* ---------------- pointer ------------------------------------ */
  hitIndex(cssX, cssY) {                   // cssY already page-relative
    const rel = cssY - (this.pageY + WORK.top);
    // new left boundary is marginX - hitShift
    if (cssX < WORK.marginX - WORK.hitShift ||
      cssX > WORK.marginX + WORK.buttonSize              ||
      rel < 0) return -1;
    const idx = Math.floor(rel / WORK.rowH);
    return idx >= 0 && idx < JOBS.length ? idx : -1;
  }

  onMove = e => {
    const r   = this.canvas.getBoundingClientRect();
    const cssX = e.clientX - r.left;
    const cssY = e.clientY - r.top;

    this.hover           = this.hitIndex(cssX, cssY);
    this.compLink.hover  = (
      cssX >= this.compLink.x && cssX <= this.compLink.x + this.compLink.w &&
      cssY >= this.compLink.y && cssY <= this.compLink.y + this.compLink.h
    );

    this.canvas.style.cursor =
      (this.compLink.hover || this.hover !== -1) ? 'pointer' : '';
  };
  onClick = e => {
    const r = this.canvas.getBoundingClientRect();
    const cssX = e.clientX - r.left;
    const cssY = e.clientY - r.top;
    const idx  = this.hitIndex(cssX, cssY);
    if (this.compLink.hover) {
      window.open(JOBS[this.sel].website, '_blank');
      return;
    }
    if (idx !== -1) this.sel = idx;


  };

  /* ---------------- draw --------------------------------------- */
  draw(scrollY) {
    const { ctx, canvas } = this;




    const dpr = window.devicePixelRatio || 1;
    const cssH = canvas.height / dpr;

    const PAGE_OFFSET = 2 * cssH;                     // *** 3 rd viewport ***
    if (scrollY < PAGE_OFFSET - cssH || scrollY > PAGE_OFFSET + cssH) return;



    const pageY = PAGE_OFFSET - scrollY;
    this.pageY  = pageY;                   // ← keep for hit-tests
    const leftX = WORK.marginX;

    /* ─── static grey track for the cyan bar ───────────────────────── */
    ctx.fillStyle = COLORS.gray15;          // translucent grey
    const railX   = leftX - WORK.padX;      // same X as cyan bar
    const railY   = pageY + WORK.top;       // top-most row
    const railH   = WORK.rowH * JOBS.length;
    ctx.fillRect(railX, railY, WORK.barW, railH);

    /* title ----------------------------------------------------- */
    ctx.save();
    const tx = leftX;                               // 1st arg to translate
    const ty = pageY + WORK.top - 100;              // 2nd arg
    ctx.translate(tx, ty);


    ctx.fillStyle = COLORS.cyan;
    ctx.font = '24px "SF Mono Regular", monospace';
    ctx.fillText('02.', 0, 8);

    //ctx.strokeStyle = COLORS.gray + '66';
    ctx.lineWidth = 1;
    const idxW = ctx.measureText('02.').width + 8;

    ctx.fillStyle = COLORS.light;
    ctx.font = 'bold 36px "Calibre", sans-serif';
    ctx.fillText('Where I’ve Worked', idxW, 10);


    ctx.strokeStyle=COLORS.gray;ctx.lineWidth=0.5;
    ctx.beginPath();
    ctx.moveTo(idxW + 300, WORK.ruleGap);
    ctx.lineTo(idxW + 300 + 300, WORK.ruleGap);
    ctx.stroke();
    ctx.restore();

    /* selector list --------------------------------------------- */
    ctx.font = '13px "SF Mono Regular", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    JOBS.forEach((job, i) => {

      const rowTop   = pageY + WORK.top + i*WORK.rowH;
      const hlY    = rowTop + WORK.hlPad;
      const hlH    = WORK.rowH - WORK.hlPad*2;
      const midY     = rowTop + WORK.rowH/2;


      /* active? */
      const isHover = i === this.hover;
      const active = i === this.sel;
      if(active || isHover){
        ctx.globalAlpha = 0.06;
        ctx.fillRect(leftX - 6, hlY, WORK.labelW, hlH);
        ctx.globalAlpha=1;
      }
      ctx.fillStyle = active
        ? COLORS.cyan                // selected → cyan
        : isHover
          ? COLORS.light               // hover   → light gray
          : COLORS.gray;               // idle    → base gray
      ctx.fillText(job.company, leftX, midY);
      // ctx.restore();
    });

    /* ----- cyan bar animation ----- */
    /* progress */
    const targetY = this.sel * WORK.rowH +
      (WORK.rowH - WORK.barH) / 2;
    this.barY += (targetY - this.barY) * WORK_ANIM.barEase;  // simple lerp

    /* draw bar */
    ctx.fillStyle = COLORS.cyan;
    const barX = leftX - WORK.padX;
    ctx.fillRect(barX, pageY + WORK.top + this.barY,
      WORK.barW, WORK.barH);

    /* highlight overlay behind active company name --------------- */
    const actY = pageY + WORK.top + this.sel * WORK.rowH;
    ctx.globalAlpha = 0.06;
    ctx.fillRect(leftX - 6,
      actY + WORK.hlPad,
      WORK.labelW,
      WORK.rowH - WORK.hlPad*2);
    ctx.globalAlpha = 1;

    /* right column ------------------------------------------------ */
    const infoX  = leftX + WORK.labelW + 40;
    const job    = JOBS[this.sel];
    const SPEED  = 0.05;                       // underline growth speed

    ctx.fillStyle = COLORS.light;
    ctx.font      = '18px "SF Mono Regular", sans-serif';
    ctx.fillText(`${job.title} @ `, infoX, pageY + WORK.top + 10);

    const titleW   = ctx.measureText(`${job.title} @ `).width;
    const compX    = infoX + titleW;
    const compY    = pageY + WORK.top + 10;
    const compW    = ctx.measureText(job.company).width;
    const compH    = 22;                       // ≈ line-height

    /* store bbox for hover tests (CSS-px) */
    Object.assign(this.compLink, { x: compX, y: compY - 5, w: compW, h: compH });

    /* progress for logistic underline */
    if (this.compLink.hover)
      this.compLink.prog = Math.min(1, this.compLink.prog + SPEED);
    else
      this.compLink.prog = Math.max(0, this.compLink.prog - SPEED);

    const t = easeLogistic(this.compLink.prog);   // 0-1

    /* cyan company text */
    ctx.fillStyle = COLORS.cyan;
    ctx.fillText(job.company, compX, compY);


    const underlineY = compY + compH - 10;
    /* underline */
    if (t > 0.01) {
      ctx.strokeStyle = COLORS.cyan;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(compX, underlineY);
      ctx.lineTo(compX + compW * t, underlineY);
      ctx.stroke();
    }

    ctx.fillStyle = COLORS.gray;
    ctx.font = '16px "SF Mono Regular", monospace';
    ctx.fillText(job.date, infoX, pageY + WORK.top + 38);

    /* -------- bullets (simple string OR nested object) ------------ */
    const lineH  = 26;
    const maxW   = WORK.maxW;
    let   by     = pageY + WORK.top + 80;

    job.bullets.forEach(b => {

      /* ---------- CASE 1: simple string (old behaviour) ---------- */
      if (typeof b === 'string') {
        drawBullet(ctx, infoX - bulletPad, by, 3);
        by = wrapLine(ctx, b, infoX, by + 2, maxW, lineH);
        return;
      }

      /* ---------- CASE 2: nested object {role, desc[]} ----------- */
      // outer bullet + role line
      drawBullet(ctx, infoX - bulletPad, by, 3);
      by = wrapLine(ctx, b.role, infoX, by + 2, maxW, lineH);

      // inner bullets, indented
      b.desc.forEach(t => {
        const innerX = infoX + SMALL_PAD;          // indent text
        drawBullet(ctx, innerX - bulletPad, by, 3, COLORS.light); // lighter glyph
        by = wrapLine(ctx, t, innerX, by + 2, maxW - SMALL_PAD, lineH);
      });
    });
    this.linkHoverGlobal = this.compLink.hover;   // share with HomeStage
  }
}
