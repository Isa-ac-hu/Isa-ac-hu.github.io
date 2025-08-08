/* noteworthyCanvas.js */
import {
  COLORS, NOTEWORTHY, NOTE_LIST,
  strokeRoundRect, easeLogistic, wrap, RESUME_URL, convert, convertInt, getScale
} from '../utils.js';

export default class NoteworthyCanvas {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;
    /* one-time intro animation */
    this.introStarted = false;
    this.introDone = false; // stays true afterwards
    this.introTimer = 0;
    this.INTRO_SPEED = 0.01;
    this.INTRO_DROP = convert(200);

    /* hover logic (per-card) */
    this.cardHover = NOTE_LIST.map(() => false);
    this.cardProg = NOTE_LIST.map(() => 0);
    this.SPEED = NOTEWORTHY.speed;

    /* expose a single boolean so HomeStage can set the cursor */
    this.hoverAny = false;

    /* icons (folder, GitHub, ↗) */
    this.icons = {
      folder : new Image(),
      gh : new Image(),
      ext : new Image()
    };
    this.icons.folder.src = './src/assets/icons/folder.svg';
    this.icons.gh.src = './src/assets/icons/gh.svg';

    canvas.addEventListener('mousemove', this.onMove);
    canvas.addEventListener('click', this.onClick);
  }

  /* helper – returns index of card under cursor or –1 */
  hitCard(cssX, cssY) {
    const { marginX, gap, cardW, cardH, top } = NOTEWORTHY;
    const cssH = this.canvas.height / (window.devicePixelRatio||1);
    /* scroll-corrected top-edge of the Noteworthy section -------- */
    const scrollY = window.scrollY || window.pageYOffset;
    const pageY = 6.2 * cssH * getScale() - scrollY;        // ← SAME formula draw() uses
    const baseY = pageY + top;
    for (let i = 0; i < NOTE_LIST.length; i++) {
      const col = i % 2, row = (i / 2) | 0;
      const x = marginX + col * (cardW + gap);
      const y = baseY   + row * (cardH + gap);
      if (cssX >= x && cssX <= x + cardW &&
        cssY >= y && cssY <= y + cardH)
        return i;
    }
      return -1;
  }

  onMove = e => {
    const r = this.canvas.getBoundingClientRect();
    const cssX = e.clientX - r.left;
    const cssY = e.clientY - r.top;
    const idx = this.hitCard(cssX, cssY);
    this.cardHover = NOTE_LIST.map((_, i) => i === idx);
    this.hoverAny = idx !== -1;
    this.canvas.style.cursor = this.hoverAny ? 'pointer' : '';
    };

  onClick = e => {
    const r = this.canvas.getBoundingClientRect();
    const cssX = e.clientX - r.left;
    const cssY = e.clientY - r.top;
    const idx = this.hitCard(cssX, cssY);
    if (idx === -1) return;
    // prevent HomeStage (and Header) from also seeing this click
    e.stopPropagation();
    /* open the per-card link (PDF or YouTube) in a new tab */
    const link = NOTE_LIST[idx].url;
    if (link) window.open(link, '_blank');
  };
  draw(scrollY) {
    const { ctx, canvas } = this;
    const dpr  = window.devicePixelRatio || 1;
    const cssH = canvas.height / dpr;

    /* viewport culling */
    const PAGE_OFFSET = 6.2 * cssH * getScale();
    if (scrollY < PAGE_OFFSET - cssH || scrollY > PAGE_OFFSET + cssH) return;
    const pageY = PAGE_OFFSET - scrollY;

    /* ─── intro bookkeeping */
    if (!this.introStarted && scrollY > PAGE_OFFSET - cssH && scrollY < PAGE_OFFSET + cssH) {
      this.introStarted = true;
    }
    if (this.introStarted && !this.introDone) {
      this.introTimer = Math.min(1, this.introTimer + this.INTRO_SPEED);
      if (this.introTimer >= 1) this.introDone = true;
    }
    const introEase = easeLogistic(this.introTimer); // 0‒1
    const dropY = this.INTRO_DROP * (1 - introEase);
    const alphaT = introEase;

    const {
      marginX, top, gap, cardW, cardH, cornerR,
      ghSize, liftPx
    } = NOTEWORTHY;

    ctx.save();
    ctx.translate(0, dropY);    // rise-up
    ctx.globalAlpha = alphaT;   // fade-in
    ctx.save();
    ctx.translate(marginX + convert(390), pageY + top - convert(50));
    ctx.fillStyle = COLORS.light;
    ctx.font = 'bold ' + convertInt(32) + 'px "Calibre", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Other Noteworthy Projects', 0, 0);
    ctx.restore();

    NOTE_LIST.forEach((p, i) => {
      /* hover ease 0‒1 */
      if (this.cardHover[i])
        this.cardProg[i] = Math.min(1, this.cardProg[i] + this.SPEED);
      else
        this.cardProg[i] = Math.max(0, this.cardProg[i] - this.SPEED);
      const t = easeLogistic(this.cardProg[i]);

      /* grid position */
      const col = i % 2, row = (i / 2) | 0;
      const baseX = marginX + col * (cardW + gap);
      const baseY = pageY  + top + row * (cardH + gap) - liftPx * t;
      ctx.save();

      /* card backing */
      ctx.lineWidth = convertInt(1);
      ctx.strokeStyle = '#182c44';
      ctx.fillStyle = '#182c44';
      strokeRoundRect(ctx, baseX, baseY, cardW, cardH, cornerR);
      ctx.fill();

      /* icons */
      const icoY = baseY + convert(22);
      const icoX = baseX + convert(22);
      const { folder, gh } = this.icons;
      if (folder.complete && folder.naturalWidth > 0)
        ctx.drawImage(folder, icoX, icoY, ghSize, ghSize);

      /* title */
      ctx.fillStyle = COLORS.light;
      ctx.font = convertInt(22) + 'px "Calibre", sans-serif';
      ctx.fillText(p.title, baseX + convert(22), baseY + convert(80));

      /* description */
      ctx.font = convertInt(17) + 'px "Calibre", sans-serif';
      ctx.fillStyle = COLORS.gray;
      const bodyMaxW = cardW - convert(44);
      wrap(ctx, p.desc, baseX + convert(22), baseY + convert(112), bodyMaxW, convert(24));

      /* tech row */
      ctx.font = convertInt(12) + 'px "SF Mono Regular", monospace';
      ctx.fillStyle = COLORS.light;
      ctx.fillText(p.tech.join('   '), baseX + convert(22), baseY + cardH - convert(32));
      ctx.restore();
    });
    ctx.restore();
  }
}
