// src/components/hero.js
import {COLORS, HERO_BTN, strokeRoundRect, easeLogistic, HERO_ANIM} from '../utils.js';


/* helper ─ wrap a long string inside maxW and draw it line‑by‑line */
function wrapFillText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(/\s+/);
  let line = '', cursorY = y;

  words.forEach((w, i) => {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW) {
      ctx.fillText(line, x, cursorY);          // draw current line
      line = w;                                // start new line
      cursorY += lineH;
    } else {
      line = test;
    }
    /* last word → flush */
    if (i === words.length - 1) ctx.fillText(line, x, cursorY);
  });
}



/* the block never animates for now – it just draws each frame */
export default class Hero {
  constructor(ctx, canvas) {
    this.ctx     = ctx;
    this.canvas  = canvas;

    this.hover        = false;   // current frame’s hover state
    this.hoverProg    = 0;       // 0‒1 logistic input
    this.SPEED        = 0.03;    // bigger = quicker fade
    /* ─── intro animation state ───────────────────────── */
    this.timer      = 0;         // global timer (advances only after header)
    this.started    = false;     // tells us when header has finished
    this.lineCount  = 6;         // 4 lines + the button
    this.lineProg   = Array(this.lineCount).fill(0);  // per-line ease input


    this.done = false;
  }
  isFinished() { return this.done; }


  setHover(flag) { this.hover = flag; }   // called from HomeStage

  draw(scrollY = 0, headerDone = false) {
    const { ctx, canvas } = this;

    /* helper */
    const drawLine = (idx, txt, font, fill, baseX, baseY) => {
      // logistic input for this line
      const raw   = this.timer - HERO_ANIM.delay - idx * HERO_ANIM.stagger;
      const t     = Math.max(0, Math.min(1, raw));      // clamp 0-1
      const easeT = easeLogistic(t);

      ctx.save();
      ctx.globalAlpha = easeT;                           // fade
      ctx.translate(0, HERO_ANIM.dropPx * (1 - easeT)); // vertical drop
      ctx.fillStyle   = fill;
      ctx.font        = font;
      ctx.fillText(txt, baseX, baseY);
      ctx.restore();
    };

    /* Start the hero animation only once, HERO_ANIM.delay sec after header */
    if (headerDone && !this.started) {
      this.started = true;         // we’ve been signalled
    }
    if (this.started && this.timer < HERO_ANIM.delay + HERO_ANIM.stagger*(this.lineCount-1)+1) {
      this.timer += HERO_ANIM.speed;   // advance master timer
    }
    // hero animation complete?  (the extra “+1” is a small grace period)
    this.done = this.timer >= HERO_ANIM.delay + HERO_ANIM.stagger * (this.lineCount - 1) + 1;

    const dpr  = window.devicePixelRatio || 1;
    const cssW = canvas.width  / dpr;
    const cssH = canvas.height / dpr;

    /* vertical placement: 25% from top looks close to the screenshot */
    const baseY   = cssH * 0.23 - scrollY;
    const lineGap = 64;   // distance between headline lines


    /* update fade progress */
    if (this.hover) this.hoverProg = Math.min(1, this.hoverProg + this.SPEED);
    else            this.hoverProg = Math.max(0, this.hoverProg - this.SPEED);
    const hueT  = easeLogistic(this.hoverProg);       // 0‒1
    const alpha = 0.25 * hueT;                        // translucent

    /* 01 ── “Hi, my name is” */
    drawLine(0, 'Hi, my name is',
        '18px "SF Mono", monospace', COLORS.cyan,
        HERO_BTN.x, baseY);

    /* 02 ── Name */
    drawLine(1, 'Isaac Hu.',
        'bold 70px "Calibre", sans-serif', COLORS.light,
        HERO_BTN.x, baseY + 40);

    /* 03 ── Tag‑line */
    drawLine(2, 'Sparking joy',
        'bold 70px "Calibre", sans-serif', COLORS.gray,
        HERO_BTN.x, baseY + 73 + lineGap);
    drawLine(3, 'through creation.',
        'bold 70px "Calibre", sans-serif', COLORS.gray,
        HERO_BTN.x, baseY + 73 + lineGap * 2);

    /* 04 ── paragraph (drop + fade) */
    {
      const idx   = 4;                                        // 0-based order
      const raw   = this.timer - HERO_ANIM.delay - idx * HERO_ANIM.stagger;
      const t     = Math.max(0, Math.min(1, raw));
      const easeT = easeLogistic(t);

      ctx.save();
      ctx.globalAlpha = easeT;
      ctx.translate(0, HERO_ANIM.dropPx * (1 - easeT));
      ctx.fillStyle = COLORS.gray;
      ctx.font      = '18px "Calibre", sans-serif';
      wrapFillText(
          ctx,
          "Greetings! I'm a recent graduate of Boston University (BA/MS in Computer Science). " +
          "Here is a showcase of my work and some other fun things!",
          HERO_BTN.x,
          baseY + 73 + lineGap * 3.4,
          700,
          30
      );
      ctx.restore();
    }

    /* 05 ── button */
    ctx.save();
    ctx.translate(HERO_BTN.x, HERO_BTN.y);

    const lineIdx = 5;   // 0-based index for staggering

    const raw   = this.timer - HERO_ANIM.delay - lineIdx * HERO_ANIM.stagger;
    const t     = Math.max(0, Math.min(1, raw));
    const easeT = easeLogistic(t);
    ctx.globalAlpha = easeT;
    ctx.translate(0, HERO_ANIM.dropPx * (1 - easeT));

    /* background tint */
    if (alpha > 0.005) {
      ctx.fillStyle = `rgba(100,255,218,${alpha})`
      ctx.fillRect(0, -scrollY + lineGap, HERO_BTN.w, HERO_BTN.h);
    }

    /* cyan rounded outline */
    ctx.lineWidth   = 1;
    ctx.strokeStyle = COLORS.cyan;
    strokeRoundRect(
      ctx,
      0,                      // x inside the translate()
      -scrollY + lineGap,                      // y …
      HERO_BTN.w,
      HERO_BTN.h,
      HERO_BTN.connectRadius,         // ← new constant from utils.js
    );

    /* label */
    ctx.fillStyle   = COLORS.cyan;
    ctx.font        = '16px "SF Mono", monospace';
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';
    ctx.fillText(HERO_BTN.label, HERO_BTN.w / 2, -scrollY + lineGap + HERO_BTN.h/2);
    ctx.restore();
  }
}