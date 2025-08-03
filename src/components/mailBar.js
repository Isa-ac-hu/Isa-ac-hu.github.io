// src/components/mailBar.js
import {BAR_ANIM, COLORS, easeLogistic, lerpHex, MAIL} from "../utils.js";

export default class MailBar {
  constructor(ctx, canvas) {
    this.ctx    = ctx;
    this.canvas = canvas;
    this.hover  = false;

    this.visible = false;     // controlled by HomeStage
    this.timer   = 0;         // 0-1 fade prog

    this.prog   = 0;      // 0‒1 fade / lift progress
    this.SPEED  = 0.08;   // higher = snappier
    this.LIFT   = 6;      // px to rise when fully hovered

    /* once-off text metrics */
    ctx.font = '16px "SF Mono", monospace';
    this.txtW = ctx.measureText(MAIL.email).width;
    this.txtH = 16;

    /* thickness of hit-zone around the vertical text */
    this.hitW = this.txtH;  // horizontal thickness
    this.hitH = this.txtW;  // vertical length

    canvas.addEventListener("mousemove", this.onMove);
    canvas.addEventListener("click",     this.onClick);
  }

  /* ------------------------------------------------------------------ */
  /** Returns true if (cssX, cssY) is inside the vertical mail bar. */
  inBar(cssX, cssY) {
    const dpr   = window.devicePixelRatio || 1;
    const cssW  = this.canvas.width / dpr;          // <-- use CSS-px width
    const left  = cssW - MAIL.x - this.hitW / 2;    // bar’s left edge (CSS)
    const lift  = this.LIFT * easeLogistic(this.prog);   // current offset
    const top   = MAIL.top - lift;

    return (
      cssX >= left          && cssX <= left + this.hitW &&
      cssY >= top           && cssY <= top  + this.hitH
    );
  }

  onMove = (e) => {
    const r     = this.canvas.getBoundingClientRect();
    const cssX  = e.clientX - r.left;
    const cssY  = e.clientY - r.top;

    this.hover = this.inBar(cssX, cssY);
    this.canvas.style.cursor = this.hover ? 'pointer' : '';
  };

  onClick = (e) => {
    const r     = this.canvas.getBoundingClientRect();
    const cssX  = e.clientX - r.left;
    const cssY  = e.clientY - r.top;

    if (this.inBar(cssX, cssY)) {
      window.open(`mailto:${MAIL.email}`, "_self");
    }
  };
  /* ---------------------------------------------------------------------- */
  draw () {
    const { ctx, canvas } = this;

    if (!this.visible) return;           // not yet
    this.timer = Math.min(1, this.timer + BAR_ANIM.speed);
    const globalT = easeLogistic(this.timer);   // 0‒1
    if (globalT < 1e-3) return;                 // skip painting while invisible
    ctx.globalAlpha = globalT;

    /* progress (0‒1) */
    if (this.hover) this.prog = Math.min(1, this.prog + this.SPEED);
    else            this.prog = Math.max(0, this.prog - this.SPEED);
    const t    = easeLogistic(this.prog);
    const lift = this.LIFT * t;                       // vertical shift
    const col  = lerpHex('#8892B0', '#64FFDA', t);    // gray → cyan

    const dpr   = window.devicePixelRatio || 1;
    const cssW  = canvas.width  / dpr;   // ← real visual width in CSS px
    const cssH  = canvas.height / dpr;   // ← not used here but handy


    const x = cssW - MAIL.x;  // center of the bar

    ctx.save();
    ctx.translate(x, MAIL.top - lift);   // slide up
    ctx.rotate(Math.PI / 2);          // ↻ 90° clockwise
    ctx.font      = '13px "SF Mono Regular", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = col;
    ctx.fillText(MAIL.email, 0, 0);   // ‑‑ now oriented vertically
    ctx.restore();

    /* slim grey line ------------------------------------------------------ */
    ctx.lineWidth   = 2;
    ctx.strokeStyle = COLORS.gray;
    ctx.beginPath();
    ctx.moveTo(x, MAIL.top + this.hitH + MAIL.lineGap);
    ctx.lineTo(x, MAIL.top + this.hitH + MAIL.lineGap + MAIL.lineH);
    ctx.stroke();
  }

  destroy () {
    this.canvas.removeEventListener('mousemove', this.onMove);
    this.canvas.removeEventListener('click',     this.onClick);
  }
}
