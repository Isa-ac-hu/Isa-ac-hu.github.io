//hero.js
import {COLORS, HERO_BTN, strokeRoundRect, easeLogistic, HERO_ANIM, convert, convertInt} from '../utils.js';

/* wrap a long string inside maxW and draw it line‑by‑line */
function wrapFillText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(/\s+/);
  let line = '', cursorY = y;

  words.forEach((w, i) => {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW) {
      ctx.fillText(line, x, cursorY);
      line = w;
      cursorY += lineH;
    } else {
      line = test;
    }
    if (i === words.length - 1) ctx.fillText(line, x, cursorY);
  });
}

export default class Hero {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas  = canvas;

    this.hover  = false; // current frame’s hover state
    this.hoverProg  = 0;
    this.SPEED = 0.03;
    /* intro animation state  */
    this.timer = 0; // global timer (advances only after header)
    this.started = false; // tells us when header has finished
    this.lineCount = 6;
    this.lineProg = Array(this.lineCount).fill(0); // per-line ease input
    this.done = false;
  }


  getButtonBounds() {
    return this._btnBounds;
  }




  isFinished() { return this.done; }

  setHover(flag) { this.hover = flag; }   // called from HomeStage

  draw(scrollY = 0, headerDone = false) {
    const { ctx, canvas } = this;

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';


    /* helper */
    const drawLine = (idx, txt, font, fill, baseX, baseY) => {
      // logistic input for this line
      const raw = this.timer - HERO_ANIM.delay - idx * HERO_ANIM.stagger;
      const t = Math.max(0, Math.min(1, raw));
      const easeT = easeLogistic(t);

      ctx.globalAlpha = easeT;
      ctx.translate(0, HERO_ANIM.dropPx * (1 - easeT)); // vertical drop
      ctx.fillStyle = fill;
      ctx.font = font;
      ctx.fillText(txt, baseX, baseY);
    };

    /* Start the hero animation only once, HERO_ANIM.delay sec after header */
    if (headerDone && !this.started) {
      this.started = true;  // we’ve been signalled
    }
    if (this.started && this.timer < HERO_ANIM.delay + HERO_ANIM.stagger*(this.lineCount-1)+1) {
      this.timer += HERO_ANIM.speed;  // advance master timer
    }
    // hero animation complete? (the extra “+1” is a small grace period)
    this.done = this.timer >= HERO_ANIM.delay + HERO_ANIM.stagger * (this.lineCount - 1) + 1;

    const dpr  = window.devicePixelRatio || 1;
    const cssW = canvas.width  / dpr;
    const cssH = canvas.height / dpr;

    const baseY = cssH * 0.23 - scrollY;
    const lineGap = convert(70);  // distance between headline lines

    /* update fade progress */
    if (this.hover) this.hoverProg = Math.min(1, this.hoverProg + this.SPEED);
    else this.hoverProg = Math.max(0, this.hoverProg - this.SPEED);
    const hueT  = easeLogistic(this.hoverProg);       // 0‒1
    const alpha = 0.25 * hueT;                        // translucent

    /* “Hi, my name is” */
    drawLine(0, 'Hi, my name is',
      convertInt(18) + 'px "SF Mono Regular", MS Comic Sans', COLORS.cyan,
      HERO_BTN.x, baseY);

    /* Name */
    drawLine(1, 'Isaac Hu.',
      '800 ' + convertInt(80) + 'px "Calibre", MS Comic Sans', COLORS.light,
      HERO_BTN.x, baseY + convert(40));

    /* Tag‑line */
    drawLine(2, 'Making joy',
      'bold ' + convertInt(80) + 'px "Calibre", MS Comic Sans', COLORS.gray,
      HERO_BTN.x, baseY + convert(60) + lineGap);
    drawLine(3, 'through creation.',
      'bold ' + convertInt(80) + 'px "Calibre", MS Comic Sans', COLORS.gray,
      HERO_BTN.x, baseY + convert(60) + lineGap * 2);

    /* paragraph  */
    {
      const idx = 4;
      const raw = this.timer - HERO_ANIM.delay - idx * HERO_ANIM.stagger;
      const t = Math.max(0, Math.min(1, raw));
      const easeT = easeLogistic(t);

      ctx.globalAlpha = easeT;
      ctx.translate(0, HERO_ANIM.dropPx * (1 - easeT));
      ctx.fillStyle = COLORS.gray;
      ctx.font = convertInt(22) + 'px "Calibre", sans-serif';
      wrapFillText(
        ctx,
        "Greetings! I'm a recent graduate of Boston University (BA/MS in Computer Science). " +
        "Here is a showcase of my work and some other fun things!",
        HERO_BTN.x,
        baseY + convert(73) + lineGap * 3.4,
        convert(750),
        convert(25)
      );
    }

    /* button */
    ctx.translate(HERO_BTN.x, baseY + convert(73) + lineGap * 3.4);

    const lineIdx = 5;
    const raw = this.timer - HERO_ANIM.delay - lineIdx * HERO_ANIM.stagger;
    const t = Math.max(0, Math.min(1, raw));
    const easeT = easeLogistic(t);
    ctx.globalAlpha = easeT;
    ctx.translate(0, HERO_ANIM.dropPx * (1 - easeT));

    /* background tint */
    if (alpha > 0.005) {
      ctx.fillStyle = `rgba(100,255,218,${alpha})`
      ctx.fillRect(0, lineGap, HERO_BTN.w, HERO_BTN.h);
    }

    /* cyan rounded outline */
    ctx.lineWidth = 1;
    ctx.strokeStyle = COLORS.cyan;
    strokeRoundRect(
      ctx,
      0,
      lineGap,
      HERO_BTN.w,
      HERO_BTN.h,
      HERO_BTN.connectRadius,
    );

    /* label */
    ctx.fillStyle = COLORS.cyan;
    ctx.font = convertInt(16) + 'px "SF Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline= 'middle';
    ctx.fillText(HERO_BTN.label, HERO_BTN.w / 2, lineGap + HERO_BTN.h/2);
    ctx.restore();

    const btnX = HERO_BTN.x;
    const btnY = (cssH * 0.23 - scrollY) + convert(73) + lineGap * 3.4 + lineGap;
    const btnW = HERO_BTN.w;
    const btnH = HERO_BTN.h;

    this._btnBounds = {
      left: btnX,
      top: btnY,
      right: btnX + btnW,
      bottom: btnY + btnH
    };


  }
}