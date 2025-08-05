/* BuildCanvas – “Some Things I’ve Built” page
   ========================================== */
import {
  COLORS, BUILDS, PROJECT_LIST,
  strokeRoundRect, easeLogistic
} from '../utils.js';

function wrappedLineCount(ctx, text, maxW) {
  const words = text.split(/\s+/);
  let line = '', count = 0;
  words.forEach((w, i) => {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW) {
      count++;                      // flush the full line
      line = w;
    } else {
      line = test;
    }
    if (i === words.length - 1) count++;   // last line
  });
  return count;
}
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

    this.isGif      = PROJECT_LIST.map(p => p.img && /\.gif$/i.test(p.img));
    this.isFrameset = PROJECT_LIST.map(p => !!p.frames);

    /* current frame index & last update time – one slot per project   */
    this.curFrame  = PROJECT_LIST.map(() => 0);
    this.lastTick  = PROJECT_LIST.map(() => performance.now());

    /* if at least one GIF is present, repaint every frame        */
    if (this.isGif.some(Boolean) || this.isFrameset.some(Boolean)) {
      const pump = () => { this.canvas.dispatchEvent(new Event('redraw'));
        requestAnimationFrame(pump); };
      requestAnimationFrame(pump);
    }
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
      scrollY > PAGE_OFFSET + 3 * cssH) return;

    const pageY = PAGE_OFFSET - scrollY;
    const { marginX, top, cornerR, ghSize } = BUILDS;

    /* section header ------------------------------------------- */
    ctx.save();
    ctx.translate(marginX, pageY + top - 100);

    ctx.fillStyle = COLORS.cyan;
    ctx.font = '24px "SF Mono Regular", monospace';
    ctx.fillText('03.', 0, 2);
    const idxW = ctx.measureText('03.').width + 8;

    ctx.fillStyle = COLORS.light;
    ctx.font = 'bold 36px "Calibre", sans-serif';
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
      /* ─────────── keep card & image vertically centred ─────────── */
      const imgCenterY  = pageY + top + p.imgPos.y + p.imgPos.h / 2;
      const cardCenterY = pageY + top + p.card.y + p.card.h / 2;
      const yOffset     = imgCenterY - cardCenterY;   // ← differential
      const projectY = pageY + top + p.card.y + yOffset;
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

      /* keep two separate Image objects for GIF entries:
         · p.animGif  → the real animated GIF
         · p.stillBmp → a PNG cut from its 1st frame          */

      if (this.isFrameset[i]) {
        /* -------- sprite-sheet style (folder full of frames) -------- */
        const { dir, ext, count } = p.frames;
        if (!p.framesArr) {                 // 1× lazy-load
          p.framesArr = Array(count).fill(null);
          for (let f = 0; f < count; f++) {
            const img = new Image();
            img.src  = `assets/gifs/${dir}${String(f).padStart(3,'0')}${ext}`;
            /* no onload needed – we’ll just skip frames that aren’t ready yet */
            p.framesArr[f] = img;
          }
          p.startTime = performance.now();  // remember when playback began
        }
      } else if (this.isGif[i]) {
        /* load the GIF once */
        if (!p.animGif) {
          p.animGif         = new Image();
          p.animGif.src     = `assets/gifs/${p.img}`;


          p.animGif.onload  = () => {
            /* grab the first frame into a frozen bitmap */
            const off = document.createElement('canvas');
            off.width  = p.animGif.naturalWidth;
            off.height = p.animGif.naturalHeight;
            off.getContext('2d').drawImage(p.animGif, 0, 0);
            p.stillBmp       = new Image();
            p.stillBmp.src   = off.toDataURL();
            this.canvas.dispatchEvent(new Event('redraw'));
          };
        }
      } else {
        /* regular PNG/JPG – keep using p.__bmp like before */
        if (!p.__bmp) {
          p.__bmp       = new Image();
          p.__bmp.src   = `assets/images/${p.img}`;
          p.__bmp.onload = () => this.canvas.dispatchEvent(new Event('redraw'));
        }
      }
      /* ------------------------------------------------------------ */
      /* choose which bitmap to draw & (optionally) advance a frame   */
      /* ------------------------------------------------------------ */
      let pic, canTint = true;

      if (this.isFrameset[i]) {
        /* ---------- sprite-sheet animation ---------- */
        const { fps, count } = p.frames;
        const msPerFrame = 1000 / fps;

        /* only advance while hovered */
        if (this.imgHover[i]) {
          const now   = performance.now();
          const delta = now - this.lastTick[i];
          const step  = Math.floor(delta / msPerFrame);
          if (step > 0) {
            this.curFrame[i] = (this.curFrame[i] + step) % count;
            this.lastTick[i] = this.lastTick[i] + step * msPerFrame;
          }
        }

        /* grab that frame (if already loaded) */
        pic = p.framesArr?.[ this.curFrame[i] ];
        if (!pic || !pic.complete) {
          /* fall back to *any* loaded frame so we never draw blank */
          pic = p.framesArr?.find(im => im && im.complete);
        }

      } else if (this.isGif[i]) {
        /* ---------- classic .gif ---------- */
        if (this.imgHover[i]) {            // playing ► never tint
          pic = p.animGif;
          canTint = false;                 // filter would freeze the GIF
        } else {                           // idle   ► use still frame & tint
          pic = p.stillBmp;
        }
      } else {
        /* ---------- static image ---------- */
        pic = p.__bmp;
      }


      if (pic && pic.complete && pic.naturalWidth)  {
        ctx.save();
        /* -------- teal-to-colour filter (same recipe as portrait) ---- */
        if (canTint) {              // filters freeze animated GIFs
          const g   = 100 * (1 - t);
          const br  =  60 + 40  * t;
          const ct  = 120 - 20  * t;
          const sp  = 100 * (1 - t);
          const hr  = 145 * (1 - t);
          const sat = 500 - 400 * t;
          ctx.filter =
            `grayscale(${g}%) brightness(${br}%) contrast(${ct}%) ` +
            `sepia(${sp}%) hue-rotate(${hr}deg) saturate(${sat}%)`;
        }

        ctx.drawImage(pic, imgX, imgY, imgW, imgH);
        ctx.filter = 'none';
        /* optional faint overlay so the tint looks identical at t=0 */
        if (canTint && t < 0.98) {                       // vanish when almost full colour
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

      /* ---------- text column -------------------------------------------------- */
      const isRight  = (p.align ?? 'right') === 'right';
      const anchorX  = isRight
        ? projectX + p.card.w - 20           // right-edge pad
        : projectX + 20;                     // left-edge pad
      const textX    = isRight ? anchorX     : anchorX;   // you already handle X later
      ctx.textAlign  = isRight ? 'right'     : 'left';

      /* fonts we’re about to use – handy numeric sizes */
      const TAG_SIZE   = 13;
      const TITLE_SIZE = 26;
      const BLURB_LH   = 26;          // line-height you already use
      const TECH_SIZE  = 13;

      /* ── 1- Measure how tall the wrapped blurb will be ─────────────────────── */
      const maxW       = p.card.w - 40;                      // inner width
      const blurbLines = wrappedLineCount(ctx, p.blurb, maxW);
      const blurbH     = blurbLines * BLURB_LH;

      /* ── 2- Decide all Y positions using only card geometry & font sizes ───── */
      const cardTop    = projectY;
      const cardBot    = projectY + p.card.h;

      /* centre the blurb inside the card */
      let blurbY   = cardTop + (p.card.h - blurbH) / 2 + 25;

      /* title sits a little above the card (10 % of card height) */
      let titleY   = cardTop - 0.25 * p.card.h;

      /* tagline sits just above the title by half a tagline line-height */
      let tagY     = titleY - TAG_SIZE * 2;   // 1× font-size looks balanced

      /* tech row sits below the card by half a tech line-height */
      let techY    = cardBot + TECH_SIZE * 2;

      let myX = 0;
      if(isRight) {
        myX = textX + 20;
      }
      else{
        myX = textX - 20;
      }
      /* ── 3- Draw everything ───────────────────────────────────────────────── */
      ctx.fillStyle = COLORS.cyan;
      ctx.font      = `${TAG_SIZE}px "SF Mono Regular", monospace`;
      ctx.fillText(p.tagline, myX, tagY);

      ctx.fillStyle = COLORS.light;
      ctx.font      = `bold ${TITLE_SIZE}px "Calibre", sans-serif`;
      ctx.fillText(p.title, myX, titleY);

      /* blurb (wrapped) */
      ctx.font      = `18px "Calibre", Comic Sans MS`;
      blurbY = wrap(ctx,
        p.blurb,
        isRight ? anchorX - 5 : anchorX,
        blurbY, maxW, BLURB_LH);

      ctx.font      = `${TECH_SIZE}px "SF Mono Regular", monospace`;
      ctx.fillStyle = COLORS.light;
      ctx.fillText(p.tech.join('   '), myX, techY);
      /* revert to default for anything drawn later */


      /* GitHub icon ------------------------------------------ */
      let ghX = myX;
      if(isRight) {
        ghX = textX - 5;
      }
      else{
        ghX = textX - 20;
      }

      const ghY = techY + 20;
      const hover = this.hovers[i];
      const icon  = hover ? this.ghHover : this.ghImg;
      if (icon.complete)
        ctx.drawImage(icon, ghX, ghY, BUILDS.ghSize, BUILDS.ghSize);

      ctx.textAlign = 'left';
    });
  }
}
