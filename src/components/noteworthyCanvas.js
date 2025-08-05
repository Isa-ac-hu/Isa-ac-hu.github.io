/* “Other Noteworthy Projects”  – scroll-page 5  (index 4) */
import {
    COLORS, NOTEWORTHY, NOTE_LIST,
    strokeRoundRect, easeLogistic, wrap, RESUME_URL
} from '../utils.js';

export default class NoteworthyCanvas {
    constructor(ctx, canvas) {
        this.ctx     = ctx;
        this.canvas  = canvas;

        /* hover logic (per-card) */
        this.cardHover = NOTE_LIST.map(() => false);
        this.cardProg  = NOTE_LIST.map(() => 0);
        this.SPEED     = NOTEWORTHY.speed;

        /* expose a single boolean so HomeStage can set the cursor */
        this.hoverAny  = false;

        /* icons (folder, GitHub, ↗) */
        this.icons = {
            folder : new Image(),
            gh     : new Image(),
            ext    : new Image()
        };
        this.icons.folder.src = 'assets/icons/folder.svg';
        this.icons.gh.src     = 'assets/icons/gh.svg';
        //this.icons.ext.src    = 'assets/icons/external-link.svg';

        /* listeners just for this section */
        canvas.addEventListener('mousemove', this.onMove);
        canvas.addEventListener('click',     this.onClick);
    }



    /* helper – returns index of card under cursor or –1 */
    hitCard(cssX, cssY) {
      const { marginX, gap, cardW, cardH, top } = NOTEWORTHY;
      const cssH  = this.canvas.height / (window.devicePixelRatio||1);
      /* scroll-corrected top-edge of the Noteworthy section -------- */
      const scrollY = window.scrollY || window.pageYOffset;
      const pageY   = 5.5 * cssH - scrollY;        // ← SAME formula draw() uses
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
        const r     = this.canvas.getBoundingClientRect();
        const cssX  = e.clientX - r.left;
        const cssY  = e.clientY - r.top;
        const idx   = this.hitCard(cssX, cssY);

        this.cardHover = NOTE_LIST.map((_, i) => i === idx);
        this.hoverAny  = idx !== -1;       // expose to HomeStage

        this.canvas.style.cursor = this.hoverAny ? 'pointer' : '';

    };
    onClick = e => {
      const r   = this.canvas.getBoundingClientRect();
      const idx = this.hitCard(e.clientX - r.left, e.clientY - r.top);
      if (idx === -1) return;
      /* open the per-card link (PDF or YouTube) in a new tab */
      const link = NOTE_LIST[idx].url;
      if (link) window.open(link, '_blank');
    };

    draw(scrollY) {
        const { ctx, canvas } = this;
        const dpr  = window.devicePixelRatio || 1;
        const cssH = canvas.height / dpr;

        /* viewport culling */
        const PAGE_OFFSET = 5.5 * cssH;
        if (scrollY < PAGE_OFFSET - cssH || scrollY > PAGE_OFFSET + cssH) return;
        const pageY = PAGE_OFFSET - scrollY;

        const {
            marginX, top, gap, cardW, cardH, cornerR,
            ghSize, liftPx
        } = NOTEWORTHY;

        /* ---- section header ---- */
        ctx.save();
        ctx.translate(marginX + 390, pageY + top - 30);
        ctx.fillStyle = COLORS.light;
        ctx.font      = 'bold 32px "Calibre", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Other Noteworthy Projects', 0, 0);

        ctx.restore();

        /* ---- 4-card grid ---- */
        NOTE_LIST.forEach((p, i) => {
            /* hover ease 0‒1 */
            if (this.cardHover[i])
                this.cardProg[i] = Math.min(1, this.cardProg[i] + this.SPEED);
            else
                this.cardProg[i] = Math.max(0, this.cardProg[i] - this.SPEED);
            const t = easeLogistic(this.cardProg[i]);

            /* grid position */
            const col  = i % 2, row = (i / 2) | 0;
            const baseX = marginX + col * (cardW + gap);
            const baseY = pageY  + top + row * (cardH + gap) - liftPx * t;

            ctx.save();

            /* card backing */
            ctx.lineWidth   = 1;
            ctx.strokeStyle = '#182c44';
            ctx.fillStyle   = '#182c44';
            strokeRoundRect(ctx, baseX, baseY, cardW, cardH, cornerR);
            ctx.fill();

            /* icons */
            const icoY = baseY + 22;
            const icoX = baseX + 22;
            const { folder, gh } = this.icons;
            if (folder.complete && folder.naturalWidth > 0)
                ctx.drawImage(folder, icoX, icoY, ghSize, ghSize);

            /* title */
            ctx.fillStyle = COLORS.light;
            ctx.font      = '22px "Calibre", sans-serif';
            ctx.fillText(p.title, baseX + 22, baseY + 80);

            /* description */
            ctx.font      = '17px "Calibre", sans-serif';
            ctx.fillStyle = COLORS.gray;
            const bodyMaxW = cardW - 44;
            wrap(ctx, p.desc, baseX + 22, baseY + 112, bodyMaxW, 24);

            /* tech row */
            ctx.font      = '12px "SF Mono Regular", monospace';
            ctx.fillStyle = COLORS.light;
            ctx.fillText(p.tech.join('   '), baseX + 22, baseY + cardH - 32);

            ctx.restore();
        });
    }
}
