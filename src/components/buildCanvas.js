/* BuildCanvas – “Some Things I’ve Built” page
   ========================================== */
import {
  COLORS, BUILDS, PROJECT_LIST,
  strokeRoundRect, easeLogistic
} from '../utils.js';

/* paragraph-wrapper copied from AboutCanvas ------------------------------------------------------- */
function wrap (ctx, txt, x, y, maxW, lh) {
  const words = txt.split(/\s+/);
  let line = '', cy = y;
  words.forEach((w, i) => {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW) {
      ctx.fillText(line, x, cy);
      line = w;  cy += lh;
    } else {
      line = test;
    }
    if (i === words.length - 1) ctx.fillText(line, x, cy);
  });
  return cy + lh;                // next y-position for caller
}

export default class BuildCanvas {
  /* helper – which image rectangle is under the cursor? */
  hitImg (cssX, cssY) {
    const { top, marginX } = BUILDS;
    const cssH   = this.canvas.height / (window.devicePixelRatio || 1);
    const scroll = window.scrollY || window.pageYOffset;   // current scroll
    const pageY  = 3 * cssH - scroll;         // exactly what draw() does
    const baseY  = pageY + top;
    for (let i = 0; i < PROJECT_LIST.length; i++) {
      const p = PROJECT_LIST[i];
      const x = marginX + p.imgPos.x;
      const y = baseY   + p.imgPos.y;
      if (
        cssX >= x               && cssX <= x + p.imgPos.w &&
        cssY >= y               && cssY <= y + p.imgPos.h
      ) return i;
    }
    return -1;
  }

  constructor (ctx, canvas) {
    this.ctx     = ctx;
    this.canvas  = canvas;

    /* per-card GitHub hover state -------------------------------- */
    this.hovers = PROJECT_LIST.map(() => false);

    /* image-hover state + progress (0→1 ease) */
    this.imgHover = PROJECT_LIST.map(() => false);
    this.imgProg  = PROJECT_LIST.map(() => 0);     // logistic input
    this.IMG_SPEED = 0.08;                         // tweak to taste

    canvas.addEventListener('mousemove', this.onMove);
    canvas.addEventListener('click',     this.onClick);

    /* preload the two GitHub SVGs once                            */
    this.ghImg  = new Image();  this.ghImg.src  = 'assets/icons/gh.svg';
    this.ghHover= new Image();  this.ghHover.src= 'assets/icons/gh-teal.svg';
  }

  /* helper – returns index of card whose GH icon is under cursor  */
  hitGH (cssX, cssY) {
    const { top, marginX, ghSize } = BUILDS;
    const cssH = this.canvas.height / (window.devicePixelRatio||1);
    const pageY = 3 * cssH;        // 3 rd viewport (after Work) starts
    const baseY = pageY + top;

    for (let i = 0; i < PROJECT_LIST.length; i++) {
      const p   = PROJECT_LIST[i];
      const gx  = (p.ghPos?.x ?? (p.card.x + p.card.w - ghSize - 12)) + marginX;
      const gy  = (p.ghPos?.y ?? (p.card.y - ghSize/2))              + baseY;
      if (
        cssX >= gx && cssX <= gx + ghSize &&
        cssY >= gy && cssY <= gy + ghSize
      ) return i;
    }
    return -1;
  }

  /* pointer ------------------------------------------------------ */
  onMove = e => {
    const r = this.canvas.getBoundingClientRect();
    const cssX = e.clientX - r.left;
    const cssY = e.clientY - r.top;

    /* ---------- GH icon ---------- */
    const ghIdx = this.hitGH(cssX, cssY);
    this.hovers = PROJECT_LIST.map((_, i) => i === ghIdx);
    /* ---------- screenshot ---------- */
    const imgIdx = this.hitImg(cssX, cssY);        // helper below
    this.imgHover = PROJECT_LIST.map((_, i) => i === imgIdx);
    /* pointer feedback */
    this.canvas.style.cursor =
      (ghIdx !== -1 || imgIdx !== -1) ? 'pointer' : '';
  };

  onClick = e => {
    const r = this.canvas.getBoundingClientRect();
    const cssX = e.clientX - r.left;
    const cssY = e.clientY - r.top;
    const idx  = this.hitGH(cssX, cssY);
    if (idx !== -1) window.open(PROJECT_LIST[idx].repo, '_blank');
  };

  /* main draw ---------------------------------------------------- */
  draw (scrollY) {
    const { ctx, canvas } = this;
    const dpr   = window.devicePixelRatio || 1;
    const cssH  = canvas.height / dpr;

    const PAGE_OFFSET = 3 * cssH;               // this is the 4 th page
    if (scrollY < PAGE_OFFSET - cssH ||
      scrollY > PAGE_OFFSET + cssH) return;

    const pageY = PAGE_OFFSET - scrollY;
    const { marginX, top, cornerR, ghSize } = BUILDS;

    /* section header ------------------------------------------- */
    ctx.save();
    ctx.translate(marginX, pageY + top - 100);

    ctx.fillStyle = COLORS.cyan;
    ctx.font = '24px "SF Mono Regular", monospace';
    ctx.fillText('03.', 0, 0);
    const idxW = ctx.measureText('03.').width + 8;

    ctx.fillStyle = COLORS.light;
    ctx.font = 'bold 28px "Calibre", sans-serif';
    ctx.fillText('Some Things I’ve Built', idxW, 0);

    ctx.strokeStyle = COLORS.gray;
    ctx.lineWidth   = 0.5;
    ctx.beginPath();
    ctx.moveTo(idxW + 340, BUILDS.ruleGap);
    ctx.lineTo(idxW + 340 + 300, BUILDS.ruleGap);
    ctx.stroke();
    ctx.restore();

    /* each project card ---------------------------------------- */
    PROJECT_LIST.forEach((p, i) => {
      const projectY = pageY + top + p.card.y;
      const projectX = marginX + p.card.x;

      /* background image, tinted  ---------------------------- */
      const imgX = marginX + p.imgPos.x;
      const imgY = pageY   + top + p.imgPos.y;
      const imgW = p.imgPos.w, imgH = p.imgPos.h;

      /* ---- update logistic progress 0→1 depending on hover ---- */
      if (this.imgHover[i])
        this.imgProg[i] = Math.min(1, this.imgProg[i] + this.IMG_SPEED);
      else
        this.imgProg[i] = Math.max(0, this.imgProg[i] - this.IMG_SPEED);
      const t = easeLogistic(this.imgProg[i]);      // 0-1 nice curve

      let bmp = p.__bmp;
      if (!bmp) {
        bmp       = p.__bmp = new Image();
        bmp.src   = `assets/images/${p.img}`;
        bmp.onload = () => this.canvas.dispatchEvent(new Event('redraw'));
      }
      if (bmp.complete) {
        ctx.save();
        /* -------- teal-to-colour filter (same recipe as portrait) ---- */
        const g   = 100 * (1 - t);
        const br  =  60 + 40  * t;
        const ct  = 120 - 20  * t;
        const sp  = 100 * (1 - t);
        const hr  = 145 * (1 - t);
        const sat = 500 - 400 * t;
        ctx.filter =
          `grayscale(${g}%) brightness(${br}%) contrast(${ct}%) ` +
          `sepia(${sp}%) hue-rotate(${hr}deg) saturate(${sat}%)`;
        ctx.drawImage(bmp, imgX, imgY, imgW, imgH);
        ctx.filter = 'none';
        /* optional faint overlay so the tint looks identical at t=0 */
        if (t < 0.98) {                       // vanish when almost full colour
          ctx.fillStyle = 'rgba(100,255,218,0.08)';
          ctx.fillRect(imgX, imgY, imgW, imgH);
        }
        ctx.restore();
      }

      /* rounded card ----------------------------------------- */
      ctx.lineWidth   = 1;
      ctx.strokeStyle = '#182c44';
      ctx.fillStyle   = '#182c44';
      strokeRoundRect(ctx, projectX, projectY,
        p.card.w, p.card.h, cornerR);
      ctx.fill();

      /* text column –– RIGHT-ALIGNED -------------------------- */
      const rightX = projectX + p.card.w - 20;   // 20-px side padding
      let   ty     = projectY - 50;              // 50 px above the card
      ctx.textAlign = 'right';
      ctx.fillStyle = COLORS.cyan;
      ctx.font      = '13px "SF Mono Regular", monospace';
      ctx.fillText(p.tagline, rightX, ty);
      ty += 30;
      ctx.fillStyle = COLORS.light;
      ctx.font      = 'bold 26px "Calibre", sans-serif';
      ctx.fillText(p.title, rightX, ty);

      /* blurb block */
      ty += 40;
      ctx.fillStyle = COLORS.light;
      ctx.font      = '16px "Calibre", Comic Sans MS';
      const lineH = 26;
      /* wrap width = card interior minus a little side padding   */
      /* neatly wrap the blurb inside the card */
      const maxW = p.card.w - 40;                 // same padding
      ty = wrap(ctx, p.blurb, rightX, ty, maxW, lineH);
      /* tech list */
      ty += lineH + 14;
      ctx.font = '13px "SF Mono Regular", monospace';
      ctx.fillStyle = COLORS.gray;
      ctx.fillText(p.tech.join('   '), rightX, ty);

      /* revert to default for anything drawn later */
      ctx.textAlign = 'left';

      /* GitHub icon ------------------------------------------ */
      const ghX = (p.ghPos?.x ?? p.card.x + p.card.w - ghSize - 12) + marginX;
      const ghY = (p.ghPos?.y ?? p.card.y - ghSize/2)               + pageY + top;
      const hover = this.hovers[i];
      const icon  = hover ? this.ghHover : this.ghImg;
      if (icon.complete)
        ctx.drawImage(icon, ghX, ghY, BUILDS.ghSize, BUILDS.ghSize);
    });
  }
}
