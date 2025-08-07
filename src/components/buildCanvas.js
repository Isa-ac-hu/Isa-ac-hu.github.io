/* BuildCanvas.js */
import {
  COLORS, BUILDS, PROJECT_LIST,
  strokeRoundRect, easeLogistic, BUILD_CURVES, bezierXY, convert, convertInt, getScale
} from '../utils.js';

function wrappedLineCount(ctx, text, maxW) {
  const words = text.split(/\s+/);
  let line = '', count = 0;
  words.forEach((w, i) => {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW) {
      count++;
      line = w;
    } else {
      line = test;
    }
    if (i === words.length - 1) count++; // last line
  });
  return count;
}
/* paragraph-wrapper */
function wrap (ctx, txt, x, y, maxW, lh) {
  const words = txt.split(/\s+/);
  let line = '', cy = y;
  words.forEach((w, i) => {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW) {
      ctx.fillText(line, x, cy);
      line = w; cy += lh;
    } else {
      line = test;
    }
    if (i === words.length - 1) ctx.fillText(line, x, cy);
  });
  return cy + lh; // next y-position for caller
}

export default class BuildCanvas {
  /* helper – which image rectangle is under the cursor? */
  hitImg (cssX, cssY) {
    const { top, marginX } = BUILDS;
    const cssH = this.canvas.height / (window.devicePixelRatio || 1);
    const scroll = window.scrollY || window.pageYOffset; // current scroll
    const pageY = 3 * cssH * getScale() - scroll;
    const baseY = pageY + top;
    for (let i = 0; i < PROJECT_LIST.length; i++) {
      const p = PROJECT_LIST[i];
      const x = marginX + p.imgPos.x;
      const y = baseY + p.imgPos.y;

      if (
        cssX >= x && cssX <= x + p.imgPos.w &&
        cssY >= y && cssY <= y + p.imgPos.h
      ) return i;
    }
    return -1;
  }

  constructor (ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;

    this.cardIntroStarted = PROJECT_LIST.map(() => false);
    this.cardIntroDone = PROJECT_LIST.map(() => false);
    this.cardIntroT = PROJECT_LIST.map(() => 0);
    this.INTRO_SPEED = 0.01;

    /* per-card GitHub hover state */
    this.hovers = PROJECT_LIST.map(() => false);
    this.ghProg  = PROJECT_LIST.map(() => 0);
    this.GH_SPEED = 0.08;

    /* image-hover state + progress (0→1 ease) */
    this.imgHover = PROJECT_LIST.map(() => false);
    this.imgProg  = PROJECT_LIST.map(() => 0);
    this.IMG_SPEED = 0.08;

    canvas.addEventListener('mousemove', this.onMove);
    canvas.addEventListener('click', this.onClick);

    /* preload the two GitHub SVGs */
    this.ghImg = new Image();
    this.ghImg.src = './src/assets/icons/gh.svg';
    this.ghHover= new Image();
    this.ghHover.src = './src/assets/icons/gh-teal.svg';

    this.isGif = PROJECT_LIST.map(p => p.img && /\.gif$/i.test(p.img));
    this.isFrameset = PROJECT_LIST.map(p => !!p.frames);

    /* current frame index & last update time – one slot per project   */
    this.curFrame = PROJECT_LIST.map(() => 0);
    this.lastTick = PROJECT_LIST.map(() => performance.now());

    /* if at least one GIF is present, repaint every frame */
    if (this.isGif.some(Boolean) || this.isFrameset.some(Boolean)) {
      const pump = () => { this.canvas.dispatchEvent(new Event('redraw'));
        requestAnimationFrame(pump); };
      requestAnimationFrame(pump);
    }
  }

  hitGH(cssX, cssY) {
    const { top, marginX, ghSize } = BUILDS;
    const cssH = this.canvas.height / (window.devicePixelRatio || 1);
    const scroll = window.scrollY || window.pageYOffset;
    const pageY = 3 * cssH - scroll;
    const baseY = pageY + top;

    for (let i = 0; i < PROJECT_LIST.length; i++) {
      const p = PROJECT_LIST[i];

      const imgCenterY = p.imgPos.y + p.imgPos.h / 2;
      const cardCenterY = p.card.y + p.card.h / 2;
      const yOffset = imgCenterY - cardCenterY;
      const projectY = baseY + p.card.y + yOffset;
      const projectX = marginX + p.card.x;

      const isRight = (p.align ?? 'right') === 'right';
      const anchorX = isRight
        ? projectX + p.card.w - convert(20)
        : projectX + convert(20);
      const textX = anchorX;
      const myX = isRight
        ? anchorX + convert(20)
        : anchorX - convert(20);

      const TECH_SIZE = convert(13);
      const techY = projectY + p.card.h + TECH_SIZE * 2;

      const introT = easeLogistic(this.cardIntroT[i]);
      const [dx, dy] = bezierXY(...BUILD_CURVES[i], 1 - introT);

      let ghX = isRight
        ? textX - convert(5)
        : textX - convert(20);
      let ghY = techY + convert(20);

      ghX += dx;
      ghY += dy;

      if (
        cssX >= ghX && cssX <= ghX + ghSize &&
        cssY >= ghY && cssY <= ghY + ghSize
      ) {
        return i;
      }
    }

    return -1;
  }

  /* pointer */
  onMove = e => {
    const r = this.canvas.getBoundingClientRect();
    const cssX = e.clientX - r.left;
    const cssY = e.clientY - r.top;

    /* GH icon  */
    const ghIdx = this.hitGH(cssX, cssY);
    this.hovers = PROJECT_LIST.map((_, i) => i === ghIdx);
    /* screenshot */
    const imgIdx = this.hitImg(cssX, cssY); // helper below
    this.imgHover = PROJECT_LIST.map((_, i) => i === imgIdx);
    /* pointer feedback */
    this.canvas.style.cursor = (ghIdx !== -1 || imgIdx !== -1) ? 'pointer' : '';
  };

  onClick = e => {
    const r = this.canvas.getBoundingClientRect();
    const cssX = e.clientX - r.left;
    const cssY = e.clientY - r.top;
    const idx = this.hitGH(cssX, cssY);
    if (idx !== -1) window.open(PROJECT_LIST[idx].repo, '_blank');
  };

  /* main draw  */
  draw (scrollY) {
    const { ctx, canvas } = this;
    const dpr = window.devicePixelRatio || 1;
    const cssH = canvas.height / dpr;

    const PAGE_OFFSET = 3 * cssH * getScale();
    if (scrollY < PAGE_OFFSET - cssH || scrollY > PAGE_OFFSET + 3 * cssH) return;

    const pageY = PAGE_OFFSET - scrollY;
    const { marginX, top, cornerR, ghSize } = BUILDS;

    /* section header */
    ctx.save();
    ctx.translate(marginX, pageY + top - convert(100));

    ctx.fillStyle = COLORS.cyan;
    ctx.font = convertInt(24) + 'px "SF Mono Regular", monospace';
    ctx.fillText('03.', convert(0), convert(2));
    const idxW = ctx.measureText('03.').width + convert(8);

    ctx.fillStyle = COLORS.light;
    ctx.font = 'bold' + convertInt(36) + 'px "Calibre", sans-serif';
    ctx.fillText('Some Things I’ve Built', idxW, convert(0));

    ctx.strokeStyle = COLORS.gray;
    ctx.lineWidth = convert(0.5);
    ctx.beginPath();
    ctx.moveTo(idxW + convert(340), BUILDS.ruleGap);
    ctx.lineTo(idxW + convert(340 + 300), BUILDS.ruleGap);
    ctx.stroke();
    ctx.restore();

    /* each project card */
    PROJECT_LIST.forEach((p, i) => {

      const imgCenterY  = pageY + top + p.imgPos.y + p.imgPos.h / 2;
      const cardCenterY = pageY + top + p.card.y + p.card.h / 2;
      const yOffset     = imgCenterY - cardCenterY;
      const projectY = pageY + top + p.card.y + yOffset;
      const projectX = marginX + p.card.x;

      // visibility test
      const cardViewportY = projectY + p.card.h;
      const inView = cardViewportY > 0 && projectY < cssH * getScale();

      if (inView && !this.cardIntroStarted[i]) {
        this.cardIntroStarted[i] = true;
      }

      if (this.cardIntroStarted[i] && !this.cardIntroDone[i]) {
        this.cardIntroT[i] = Math.min(1, this.cardIntroT[i] + this.INTRO_SPEED);
        if (this.cardIntroT[i] >= 1) this.cardIntroDone[i] = true;
      }
      const introT = easeLogistic(this.cardIntroT[i]);

      /* background image, tinted */
      const imgX = marginX + p.imgPos.x;
      const imgY = pageY   + top + p.imgPos.y;
      const imgW = p.imgPos.w, imgH = p.imgPos.h;

      /*  update logistic progress 0 to 1 depending on hover */
      if (this.imgHover[i])
        this.imgProg[i] = Math.min(1, this.imgProg[i] + this.IMG_SPEED);
      else
        this.imgProg[i] = Math.max(0, this.imgProg[i] - this.IMG_SPEED);
      const t = easeLogistic(this.imgProg[i]);      // 0-1 nice curve

       /* regular image */
      if (!p.__bmp) {
        p.__bmp = new Image();
        p.__bmp.src = `./src/assets/images/${p.img}`;
        p.__bmp.onload = () => this.canvas.dispatchEvent(new Event('redraw'));
      }

      let pic, canTint = true;

      if (this.isFrameset[i]) {
        const { fps, count } = p.frames;
        const msPerFrame = 1000 / fps;

        /* only advance while hovered */
        if (this.imgHover[i]) {
          const now   = performance.now();
          const delta = now - this.lastTick[i];
          const step = Math.floor(delta / msPerFrame);
          if (step > 0) {
            this.curFrame[i] = (this.curFrame[i] + step) % count;
            this.lastTick[i] = this.lastTick[i] + step * msPerFrame;
          }
        }

        /* grab that frame (if already loaded) */
        pic = p.framesArr?.[ this.curFrame[i] ];
        if (!pic || !pic.complete) {
          pic = p.framesArr?.find(im => im && im.complete);
        }

      } else if (this.isGif[i]) {
        if (this.imgHover[i]) {
          pic = p.animGif;
          canTint = false; // filter would freeze the GIF
        } else {  // use still frame and tint if idle
          pic = p.stillBmp;
        }
      } else {
        /* static images */
        pic = p.__bmp;
      }


      if (pic && pic.complete && pic.naturalWidth)  {
        ctx.save();
        /* turn from teal to colored */
        if (canTint) {
          const g = 100 * (1 - t);
          const br =  60 + 40  * t;
          const ct = 120 - 20  * t;
          const sp = 100 * (1 - t);
          const hr = 145 * (1 - t);
          const sat = 500 - 400 * t;
          ctx.filter =
            `grayscale(${g}%) brightness(${br}%) contrast(${ct}%) ` +
            `sepia(${sp}%) hue-rotate(${hr}deg) saturate(${sat}%)`;
        }

        ctx.drawImage(pic, imgX, imgY, imgW, imgH);
        ctx.filter = 'none';
        if (canTint && t < 0.98) { // vanish when almost full color
          ctx.fillStyle = 'rgba(100,255,218,0.08)';
          ctx.fillRect(imgX, imgY, imgW, imgH);
        }
        ctx.restore();
      }

      /* Bézier offset  */
      const curve = BUILD_CURVES[i] ?? [[0,0],[0,0],[0,0],[0,0]];
      const [dx, dy] = bezierXY(...curve, 1 - introT);

      ctx.save();
      ctx.globalAlpha = introT;
      ctx.translate(dx, dy);

      /* rounded card  */
      ctx.lineWidth   = convert(1);
      ctx.strokeStyle = '#182c44';
      ctx.fillStyle   = '#182c44';
      strokeRoundRect(ctx, projectX, projectY,
        p.card.w, p.card.h, cornerR);
      ctx.fill();

      /* text column */
      const isRight = (p.align ?? 'right') === 'right';
      const anchorX = isRight
        ? projectX + p.card.w - convert(20)
        : projectX + convert(20);
      const textX = isRight ? anchorX : anchorX;
      ctx.textAlign  = isRight ? 'right'     : 'left';

      const TAG_SIZE = convert(13);
      const TITLE_SIZE = convert(26);
      const BLURB_LH = convert(26);
      const TECH_SIZE = convert(13);

      /* Measure how tall the wrapped blurb will be */
      const maxW = p.card.w - convert(40);
      const blurbLines = wrappedLineCount(ctx, p.blurb, maxW);
      const blurbH = blurbLines * BLURB_LH;

      /* Decide all Y positions using only card geometry & font sizes*/
      const cardTop = projectY;
      const cardBot = projectY + p.card.h;

      /* center the blurb inside the card */
      let blurbY = cardTop + (p.card.h - blurbH) / 2;

      /* title sits a little above the card (25 % of card height) */
      let titleY = cardTop - 0.25 * p.card.h;

      /* tagline sits just above the title by half a tagline line-height */
      let tagY = titleY - TAG_SIZE * 2;   // 1× font-size looks balanced

      /* tech row sits below the card by half a tech line-height */
      let techY = cardBot + TECH_SIZE * 2;

      let myX = 0;
      if(isRight) {
        myX = textX + convert(20);
      }
      else{
        myX = textX - convert(20);
      }
      /* Draw everything */
      ctx.fillStyle = COLORS.cyan;
      ctx.font = `${TAG_SIZE}px "SF Mono Regular", monospace`;
      ctx.fillText(p.tagline, myX, tagY);

      ctx.fillStyle = COLORS.light;
      ctx.font = `bold ${TITLE_SIZE}px "Calibre", sans-serif`;
      ctx.fillText(p.title, myX, titleY);

      /* blurb (wrapped) */
      ctx.font = convertInt(18) + `px "Calibre", Comic Sans MS`;
      blurbY = wrap(ctx,
        p.blurb,
        isRight ? anchorX - convert(5) : anchorX,
        blurbY, maxW, BLURB_LH);

      ctx.font = `${TECH_SIZE}px "SF Mono Regular", monospace`;
      ctx.fillStyle = COLORS.light;
      ctx.fillText(p.tech.join('   '), myX, techY);
      /* revert to default for anything drawn later */

      /* GitHub icon ------------------------------------------ */
      let ghX;
      if(isRight) {
        ghX = textX - convert(5);
      }
      else{
        ghX = textX - convert(20);
      }
      const ghY = techY + convert(20);

      // update logistic fade toward hover
      this.ghProg[i] = this.hovers[i]
        ? Math.min(1, this.ghProg[i] + this.GH_SPEED)
        : Math.max(0, this.ghProg[i] - this.GH_SPEED);
      const ghT = easeLogistic(this.ghProg[i]);
      // cross-fade base to hover icon
      ctx.save();
      ctx.globalAlpha = 1 - ghT;
      if (this.ghImg.complete)
        ctx.drawImage(this.ghImg, ghX, ghY, BUILDS.ghSize, BUILDS.ghSize);
      ctx.globalAlpha = ghT;
      if (this.ghHover.complete)
        ctx.drawImage(this.ghHover, ghX, ghY, BUILDS.ghSize, BUILDS.ghSize);
      ctx.restore();
      ctx.textAlign = 'left';
      ctx.restore()
    });
  }
}
