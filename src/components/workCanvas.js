/* workCanvas.js */
import {
  COLORS, WORK, JOBS, BULLET, strokeRoundRect,
  easeLogistic, WORK_ANIM, convert, convertInt,
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
  return cy + lineH;
}

const drawBullet = (ctx, x, y, size = convert(3), color = COLORS.cyan) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = convert(2);
  ctx.beginPath();
  ctx.moveTo(x, y + size * .1);
  ctx.lineTo(x + size,y + size * .5);
  ctx.lineTo(x, y + size * .9);
  ctx.closePath();
  ctx.stroke();
};

const SMALL_PAD = convert(30); // indent for inner bullets
const bulletPad = convert(20);

export default class WorkCanvas {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;

    /* intro animation state  */
    this.introStarted = false;   // first time Work is on-screen
    this.introDone = false;   // stays true afterwards
    this.introTimer = 0;
    this.INTRO_SPEED = 0.01;
    this.INTRO_DROP = convert(200);

    this.compLink = { x:0, y:0, w:0, h:0, prog:0, hover:false };

    this.sel = 0; // selected job index
    this.hover = -1;  // hover index (-1 = none)
    this.barProg = 0;
    this.barY = 0;
    this.pageY = 0;

    canvas.addEventListener('mousemove', this.onMove);
    canvas.addEventListener('click', this.onClick);
  }

  /* pointer  */
  hitIndex(cssX, cssY) {
    const rel = cssY - (this.pageY + WORK.top);
    // new left boundary is marginX - hitShift
    if (cssX < WORK.marginX - WORK.hitShift || cssX > WORK.marginX + WORK.buttonSize || rel < 0) return -1;
    const idx = Math.floor(rel / WORK.rowH);
    return idx >= 0 && idx < JOBS.length ? idx : -1;
  }

  onMove = e => {
    const r = this.canvas.getBoundingClientRect();
    const cssX = e.clientX - r.left;
    const cssY = e.clientY - r.top;

    this.hover = this.hitIndex(cssX, cssY);
    this.compLink.hover = (
      cssX >= this.compLink.x && cssX <= this.compLink.x + this.compLink.w &&
      cssY >= this.compLink.y && cssY <= this.compLink.y + this.compLink.h
    );

    this.canvas.style.cursor = (this.compLink.hover || this.hover !== -1) ? 'pointer' : '';
  };
  onClick = e => {
    const r = this.canvas.getBoundingClientRect();
    const cssX = e.clientX - r.left;
    const cssY = e.clientY - r.top;
    const idx = this.hitIndex(cssX, cssY);
    if (this.compLink.hover) {
      window.open(JOBS[this.sel].website, '_blank');
      return;
    }
    if (idx !== -1) this.sel = idx;
  };

  /* draw  */
  draw(scrollY) {
    const { ctx, canvas } = this;
    const dpr = window.devicePixelRatio || 1;
    const cssH = canvas.height / dpr;
    const PAGE_OFFSET = 2 * cssH;
    if (scrollY < PAGE_OFFSET - cssH || scrollY > PAGE_OFFSET + cssH) return;
    const pageY = PAGE_OFFSET - scrollY;
    this.pageY  = pageY;

    /*  trigger intro once the section is visible  */
    if (!this.introStarted &&
      scrollY > PAGE_OFFSET - cssH && scrollY < PAGE_OFFSET + cssH) {
      this.introStarted = true;
    }
    if (this.introStarted && !this.introDone) {
      this.introTimer = Math.min(1, this.introTimer + this.INTRO_SPEED);
      if (this.introTimer >= 1) this.introDone = true;
    }
    const easeT = easeLogistic(this.introTimer);
    const dropY = this.INTRO_DROP * (1 - easeT);
    const alphaT  = easeT;
    /* draw everything under a translate + alpha */
    ctx.save();
    ctx.translate(0, dropY);
    ctx.globalAlpha = alphaT;

    const leftX = WORK.marginX;

    /* static grey track for the cyan bar */
    ctx.fillStyle = COLORS.gray15;
    const railX = leftX - WORK.padX;
    const railY = pageY + WORK.top;
    const railH = WORK.rowH * JOBS.length;
    ctx.fillRect(railX, railY, WORK.barW, railH);

    /* title  */
    ctx.save();
    const tx = leftX;
    const ty = pageY + WORK.top - convert(100);
    ctx.translate(tx, ty);

    ctx.fillStyle = COLORS.cyan;
    ctx.font = convertInt(24) + 'px "SF Mono Regular", monospace';
    ctx.fillText('02.', 0, 8);

    ctx.lineWidth = convert(1);
    const idxW = ctx.measureText('02.').width + convert(8);

    ctx.fillStyle = COLORS.light;
    ctx.font = 'bold ' + convertInt(36) + 'px "Calibre", sans-serif';
    ctx.fillText('Where I’ve Worked', idxW, convert(10));

    ctx.strokeStyle=COLORS.gray;ctx.lineWidth=convert(0.5);
    ctx.beginPath();
    ctx.moveTo(idxW + convert(300), WORK.ruleGap);
    ctx.lineTo(idxW + convert(300 + 300), WORK.ruleGap);
    ctx.stroke();
    ctx.restore();

    /* selector list */
    ctx.font = convertInt(13) + 'px "SF Mono Regular", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    JOBS.forEach((job, i) => {
      const rowTop = pageY + WORK.top + i*WORK.rowH;
      const hlY = rowTop + WORK.hlPad;
      const hlH = WORK.rowH - WORK.hlPad*2;
      const midY = rowTop + WORK.rowH/2;

      /* active? */
      const isHover = i === this.hover;
      const active = i === this.sel;
      if(active || isHover){
        ctx.globalAlpha = 0.06;
        ctx.fillRect(leftX - convert(6), hlY, WORK.labelW, hlH);
        ctx.globalAlpha=1;
      }
      ctx.fillStyle = active
        ? COLORS.cyan
        : isHover
          ? COLORS.light
          : COLORS.gray;
      ctx.fillText(job.company, leftX, midY);
    });

    /* cyan bar animation */

    const targetY = this.sel * WORK.rowH +
      (WORK.rowH - WORK.barH) / 2;
    this.barY += (targetY - this.barY) * WORK_ANIM.barEase;  // simple lerp

    /* draw bar */
    ctx.fillStyle = COLORS.cyan;
    const barX = leftX - WORK.padX;
    ctx.fillRect(barX, pageY + WORK.top + this.barY,
      WORK.barW, WORK.barH);

    /* highlight overlay behind active company name  */
    const actY = pageY + WORK.top + this.sel * WORK.rowH;
    ctx.globalAlpha = 0.06;
    ctx.fillRect(leftX - convert(6),
      actY + WORK.hlPad,
      WORK.labelW,
      WORK.rowH - WORK.hlPad*2);
    ctx.globalAlpha = 1;

    /* right column  */
    const infoX = leftX + WORK.labelW + convert(40);
    const job = JOBS[this.sel];
    const SPEED = 0.05;

    ctx.fillStyle = COLORS.light;
    ctx.font = convertInt(18) + 'px "SF Mono Regular", sans-serif';
    ctx.fillText(`${job.title} @ `, infoX, pageY + WORK.top + convert(10));

    const titleW = ctx.measureText(`${job.title} @ `).width;
    const compX = infoX + titleW;
    const compY = pageY + WORK.top + convert(10);
    const compW = ctx.measureText(job.company).width;
    const compH = convert(22);

    /* store bbox for hover tests (CSS-px) */
    Object.assign(this.compLink, { x: compX, y: compY - convert(5), w: compW, h: compH });

    /* progress for logistic underline */
    if (this.compLink.hover)
      this.compLink.prog = Math.min(1, this.compLink.prog + SPEED);
    else
      this.compLink.prog = Math.max(0, this.compLink.prog - SPEED);

    const t = easeLogistic(this.compLink.prog);   // 0-1

    /* cyan company text */
    ctx.fillStyle = COLORS.cyan;
    ctx.fillText(job.company, compX, compY);

    const underlineY = compY + compH - convert(10);
    /* underline */
    if (t > 0.01) {
      ctx.strokeStyle = COLORS.cyan;
      ctx.lineWidth = convert(2);
      ctx.beginPath();
      ctx.moveTo(compX, underlineY);
      ctx.lineTo(compX + compW * t, underlineY);
      ctx.stroke();
    }

    ctx.fillStyle = COLORS.gray;
    ctx.font = convertInt(16) + 'px "SF Mono Regular", monospace';
    ctx.fillText(job.date, infoX, pageY + WORK.top + convert(38));

    /*  bullets (simple string OR nested object)  */
    const lineH = convert(26);
    const maxW = WORK.maxW;
    let by = pageY + WORK.top + convert(80);

    job.bullets.forEach(b => {
      /* simple string */
      if (typeof b === 'string') {
        drawBullet(ctx, infoX - bulletPad, by, convert(3));
        by = wrapLine(ctx, b, infoX, by + convert(2), maxW, lineH);
        return;
      }

      /* nested object {role, desc[]} */
      drawBullet(ctx, infoX - bulletPad, by, convert(3));
      by = wrapLine(ctx, b.role, infoX, by + convert(2), maxW, lineH);

      // inner bullets, indented
      b.desc.forEach(t => {
        const innerX = infoX + SMALL_PAD;
        drawBullet(ctx, innerX - bulletPad, by, convert(3), COLORS.light);
        by = wrapLine(ctx, t, innerX, by + convert(2), maxW - SMALL_PAD, lineH);
      });
    });
    this.linkHoverGlobal = this.compLink.hover; // share with HomeStage
    ctx.restore();
  }
}
