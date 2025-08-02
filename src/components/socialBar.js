import { COLORS, SOCIAL } from '../utils.js';

/* fallback doodle while the SVG hasn’t loaded yet */
function drawStub(ctx, id, s) {
  const r = s * 0.35;
  ctx.beginPath();
  switch (id) {
    case 'gh': ctx.arc(0, 0, r, 0, Math.PI * 2); break;          // ◯ github
    case 'ln': ctx.rect(-r, -r, r * 2, r * 2);    break;         // ■ linkedin
    case 'ig': ctx.moveTo(-r, r); ctx.lineTo(r, -r);             // ⧉ instagram
      ctx.moveTo(-r, -r); ctx.lineTo(r, r); break;
    case 'tw': ctx.moveTo(-r, 0); ctx.lineTo( r, 0);             // ― twitter
      ctx.moveTo(0, -r); ctx.lineTo(0, r); break;
  }
  ctx.stroke();
}


/* -------------------------------------------------- */
/* 1. one‑time SVG pre‑load                           */
/* -------------------------------------------------- */
const ICON_IMG = Object.create(null);        // id  →  HTMLImageElement
let   preloadPromise;                        // make sure we only fetch once


function loadIcon(id) {
  return new Promise(res => {
    const img = new Image();
    img.src   = `assets/icons/${id}.svg`;
    img.onload = () => {          // store & resolve when ready
      ICON_IMG[id] = img;
      res();
    };
  });
}


function preloadIcons () {
  if (preloadPromise) return preloadPromise; // already running / done

  // load both the normal and hover (“‑teal”) variants
  const tasks = [];
  SOCIAL.icons.forEach(ic => {
    tasks.push(loadIcon(ic.id));
    tasks.push(loadIcon(ic.hoverId));
  });
  preloadPromise = Promise.all(tasks);
  return preloadPromise;
}

export default class SocialBar {
  constructor(ctx, canvas) {
    this.ctx     = ctx;
    this.canvas  = canvas;

    /* per‑icon hover state */
    this.hovers  = SOCIAL.icons.map(() => false);

    canvas.addEventListener('mousemove', this.onMove);
    canvas.addEventListener('click',     this.onClick);

    preloadIcons();
  }

  /* hit‑testing helper */
  hitIndex(cssX, cssY) {
    const { x, top, size, gap } = SOCIAL;
    for (let i = 0; i < SOCIAL.icons.length; i++) {
      const bx = x - size / 2, by = top + i * (size + gap) - size / 2;
      if (
        cssX >= bx && cssX <= bx + size &&
        cssY >= by && cssY <= by + size
      ) return i;
    }
    return -1;
  }

  /* cursor + hover */
  onMove = (e) => {
    const rect = this.canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;

    const idx = this.hitIndex(cssX, cssY);
    //this.canvas.style.cursor = idx >= 0 ? 'pointer' : '';

    this.hovers = this.hovers.map((_, i) => i === idx);
  };
  get hoverAny () { return this.hovers.some(h => h); }

  /* click → open url */
  onClick = (e) => {
    const rect = this.canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const idx  = this.hitIndex(cssX, cssY);
    if (idx >= 0) window.open(SOCIAL.icons[idx].url, '_blank');
  };

  /* draw every frame */
  draw() {
    const { ctx } = this;
    ctx.save();
    ctx.lineWidth   = 2;

    SOCIAL.icons.forEach((ic, i) => {
      const lift   = this.hovers[i] ? -SOCIAL.lift : 0;
      const alpha  = 1;
      const color  = this.hovers[i] ? COLORS.cyan : COLORS.gray;

      const cx = SOCIAL.x;
      const cy = SOCIAL.top + i * (SOCIAL.size + SOCIAL.gap) + lift;

      ctx.save();
      ctx.translate(cx, cy);
      /* ------------ icon ------------ */

      const bmp = this.hovers[i] ? ICON_IMG[ic.hoverId] : ICON_IMG[ic.id];
      if (bmp) {

        ctx.drawImage(
          bmp,
          -SOCIAL.size / 2, -SOCIAL.size / 2,
          SOCIAL.size, SOCIAL.size
        );
        ctx.globalCompositeOperation = 'source-atop';



      } else {
        //ctx.strokeStyle = color;
        drawStub(ctx, ic.id, SOCIAL.size);   // placeholder until onload fires
      }
      //ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    });

    /* grey vertical line */
    const lastY = SOCIAL.top + (SOCIAL.icons.length - 1) * (SOCIAL.size + SOCIAL.gap * 1.5);
    ctx.strokeStyle = COLORS.gray;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(SOCIAL.x, lastY + SOCIAL.size / 2 + 12);
    ctx.lineTo(SOCIAL.x, lastY + SOCIAL.size / 2 + 12 + SOCIAL.lineH);
    ctx.stroke();

    ctx.restore();
  }

  /* (optional) cleanup if you ever destroy HomeStage */
  destroy() {
    this.canvas.removeEventListener('mousemove', this.onMove);
    this.canvas.removeEventListener('click',     this.onClick);
  }
}