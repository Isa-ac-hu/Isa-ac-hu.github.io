// src/components/hero.js
import { COLORS, HERO_BTN, strokeRoundRect } from '../utils.js';


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
  }

  draw(scrollY = 0) {
    const { ctx, canvas } = this;

    const dpr  = window.devicePixelRatio || 1;
    const cssW = canvas.width  / dpr;
    const cssH = canvas.height / dpr;

    /* vertical placement: 25% from top looks close to the screenshot */
    const baseY   = cssH * 0.23 - scrollY;
    const lineGap = 64;   // distance between headline lines

    /* 01 ── “Hi, my name is” */
    ctx.fillStyle = COLORS.cyan;
    ctx.font      = '18px "SF Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Hi, my name is', HERO_BTN.x, baseY);

    /* 02 ── Name */
    ctx.fillStyle = COLORS.light;
    ctx.font      = 'bold 70px "Calibre", sans-serif';
    ctx.fillText('Isaac Hu.', HERO_BTN.x, baseY + 40);

    /* 03 ── Tag‑line */
    ctx.fillStyle = COLORS.gray;
    ctx.font      = 'bold 70px "Calibre", sans-serif';
    ctx.fillText('Sparking joy', HERO_BTN.x, baseY + 73 + lineGap);
    ctx.fillText('through creation.',      HERO_BTN.x, baseY + 73 + lineGap * 2);

    /* 04 ── paragraph */
    ctx.fillStyle = COLORS.gray;
    ctx.font      = '18px "Calibre", sans-serif';
    ctx.maxWidth  = 700;
    wrapFillText(
      ctx,
      "Greetings! I'm a recent graduate of Boston University (BA/MS in Computer Science). " +
      "Here is a showcase of my work and some other fun things!",
      HERO_BTN.x,                                 // x
      baseY + 73 + lineGap * 3.4,          // starting y
      700,                                 // max line width
      30                                   // line height ≈ font‑size+10
    );

    /* 05 ── “Get In Touch” button */
    ctx.save();
    ctx.translate(HERO_BTN.x, HERO_BTN.y);
    /* (optional) red debug hit‑box */
    // ctx.fillStyle = 'rgba(255,0,0,.15)';
    // ctx.fillRect(0, 0, HERO_BTN.w, HERO_BTN.h);

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