/* src/components/aboutCanvas.js --------------------------------------- */
import { BULLET, COLORS, ABOUT, strokeRoundRect, SKILL_GROUPS, PORTRAIT_ANIM, easeLogistic  } from '../utils.js';


export default class AboutCanvas{
  constructor(ctx,canvas){
    this.ctx     = ctx;
    this.canvas  = canvas;

    this.introStarted = false;   // becomes true the first time it’s on-screen
    this.introDone    = false;   // stays true afterwards
    this.introTimer   = 0;       // logistic input 0 → 1
    this.INTRO_SPEED  = 0.02;    // tweak to taste
    this.INTRO_DROP   = 200;      // px it climbs while fading in

    /* run-time state for one interactive link ------------------ */
    this.buLink = {                       // geometry filled in later
      x:0,y:0,w:0,h:0,
      prog:0,           // 0→1 underline progress
      hover:false
    };

    /* run-time state for the portrait hover -------------------- */
    this.portraitHover = false;  // current pointer state
    this.portraitProg  = 0;      // 0‒1 logistic input

    /* pointer listeners once per AboutCanvas instance ---------- */
    canvas.addEventListener('mousemove', this.onMove );
    canvas.addEventListener('click'    , this.onClick);
  }
  /* simple logistic ease for underline */
  static ease(t,k=10){return 1/(1+Math.exp(-k*(t-.5)));}

  /* hit-test helper */
  inLink(cssX,cssY){
    const {x,y,w,h}=this.buLink;
    return cssX>=x && cssX<=x+w && cssY>=y && cssY<=y+h;
  }
  /* pointer handlers ------------------------------------------- */
  onMove = e =>{
    const r=this.canvas.getBoundingClientRect();
    const cssX=e.clientX-r.left, cssY=e.clientY-r.top;
    this.buLink.hover=this.inLink(cssX,cssY);

    // ─── portrait hit-test (uses last-frame bbox) ─────────────
    if (this.portraitBox) {
      const {x, y, w, h} = this.portraitBox;
      this.portraitHover = cssX >= x && cssX <= x+w && cssY >= y && cssY <= y+h;
    }


    this.canvas.style.cursor = ( this.buLink.hover || this.portraitHover ) ? 'pointer' : '';
  }
  onClick = ()=>{ if(this.buLink.hover) window.open('https://www.bu.edu/','_blank'); }

  /* helper: paragraph word‑wrap */
  wrap(txt,x,y,maxW,lh){
    const {ctx}=this;const words=txt.split(/\s+/);let line='',cy=y;
    words.forEach((w,i)=>{
      const test=line?line+' '+w:w;
      if(ctx.measureText(test).width>maxW){
        ctx.fillText(line,x,cy);line=w;cy+=lh;
      }else line=test;
      if(i===words.length-1)ctx.fillText(line,x,cy);
    });
    return cy+lh;
  }

  draw(scrollY){
    const {ctx,canvas}=this;
    const dpr=window.devicePixelRatio||1;
    const cssH=canvas.height/dpr;        // viewport height
    const offset=cssH;                   // About page starts after one vh
    const { pad, size, width } = BULLET;
    /* cheap cull */
    if(scrollY<offset-cssH||scrollY>offset+cssH)return;

    const pageY  = offset-scrollY;       // page‑top in canvas space

    /* trigger the intro the first time About becomes visible */
    if (!this.introStarted &&
      scrollY > offset - cssH && scrollY < offset + cssH) {
      this.introStarted = true;
    }

    /* after triggering logic – still near the top of draw() */
    if (this.introStarted && !this.introDone) {
      this.introTimer = Math.min(1, this.introTimer + this.INTRO_SPEED);
      if (this.introTimer >= 1) this.introDone = true;
    }
    const easeT   = easeLogistic(this.introTimer);     // 0‒1
    const dropY   = this.INTRO_DROP * (1 - easeT);     // 40 px → 0
    const alphaT  = easeT;                             // same logistic for α


    const baseX  = ABOUT.marginX;
    let   y      = pageY+ABOUT.top;

    ctx.save();
    ctx.translate(0, dropY);      // rise up
    ctx.globalAlpha = alphaT;     // logistic fade-in

    /* 01 – cyan index */
    ctx.fillStyle=COLORS.cyan;
    ctx.font     ='24px "SF Mono Regular", monospace';
    ctx.textAlign='left';ctx.textBaseline='top';
    ctx.fillText('01.',baseX,y + 8);
    const idxW=ctx.measureText('01.').width+8;

    /* heading text */
    ctx.fillStyle=COLORS.light;
    ctx.font     ='bold 36px "Calibre", sans-serif';
    ctx.fillText('About Me',baseX+idxW,y);

    /* grey horizontal rule */
    ctx.strokeStyle=COLORS.gray+'66';ctx.lineWidth=0.5;
    ctx.beginPath();
    ctx.moveTo(baseX+idxW+160,y+ABOUT.ruleGap);
    ctx.lineTo(baseX+idxW+160 + ABOUT.lineLength,y+ABOUT.ruleGap);
    ctx.stroke();

    y+=80;

    /* paragraphs */
    ctx.fillStyle=COLORS.gray;
    ctx.font     ='20px "Calibre", sans-serif';
    y=this.wrap("I have a combined Bachelor of Arts/Master of Science in computer science from Boston University, completed in May 2025, with prominent coursework in embedded systems, statistics, machine learning, and software design.",baseX,y,ABOUT.maxW,ABOUT.paraLH);
    y=this.wrap("",baseX,y - 15,ABOUT.maxW,ABOUT.paraLH);
    y=this.wrap("Outside of school, I have done some internships and personal projects that have developed my understanding of many different facets of the computing world!",baseX,y,ABOUT.maxW,ABOUT.paraLH);
    y=this.wrap("",baseX,y - 15,ABOUT.maxW,ABOUT.paraLH);
    y=this.wrap("Here are some technologies that I've worked with across my various endeavors: ",baseX,y,ABOUT.maxW,ABOUT.paraLH);
    y=this.wrap("",baseX,y - 15,ABOUT.maxW,ABOUT.paraLH);
    /* skill groups ------------------------------------------------------ */

    /* -------- highlight “Boston University” word manually --------------- */
    const buText   = 'Boston University';
    ctx.font       = '20px "Calibre", sans-serif';
    const pre      = 'I have a combined Bachelor of Arts/Master of Science in computer science from ';
    const preW     = ctx.measureText(pre).width;
    const buW      = ctx.measureText(buText).width;
    const linkX    = baseX + 182;        // x-pos where BU starts
    const linkY    = (offset-scrollY) + ABOUT.top + 80 + 30; // same paragraph Y + tweak
    /* store bounding box once (for hit-testing) */
    Object.assign(this.buLink,{x:linkX,y:linkY,w:buW,h:ABOUT.paraLH});
    /* progressive underline ------------------------------------ */
    const SPEED=.05;
    if(this.buLink.hover) this.buLink.prog=Math.min(1,this.buLink.prog+SPEED);
    else                  this.buLink.prog=Math.max(0,this.buLink.prog-SPEED);
    const t = AboutCanvas.ease(this.buLink.prog);
    ctx.fillStyle = COLORS.cyan;
    ctx.fillText(buText,linkX,linkY);

    if (t > 0.01) {                       // draw only if some progress
      ctx.strokeStyle = COLORS.cyan;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(linkX         , linkY + ABOUT.paraLH - 10);
      ctx.lineTo(linkX + buW*t , linkY + ABOUT.paraLH - 10);
      ctx.stroke();
    }

    ctx.font = '13px "SF Mono Regular", monospace';
    const groups      = Object.values(SKILL_GROUPS);
    const maxRows     = Math.max(...groups.map(g => g.length));
    const colGap      = ABOUT.colGap;
    groups.forEach((list, col) => {
      list.forEach((txt, row) => {
        const x  = baseX + col * colGap + ABOUT.rightShiftBullets;
        const ly = y + ABOUT.firstColY + row * ABOUT.skillLH;

        /* bullet ► ---------------------------------------------------- */
        const { pad, size, width } = BULLET;
        ctx.strokeStyle = COLORS.cyan;
        ctx.lineWidth   = width;
        ctx.beginPath();
        ctx.moveTo(x - pad       , ly + size * 0.1);
        ctx.lineTo(x - pad + size, ly + size * 0.5);
        ctx.lineTo(x - pad       , ly + size * 0.9);
        ctx.closePath();
        ctx.stroke();

        /* label ------------------------------------------------------- */
        ctx.fillStyle    = COLORS.gray;
        ctx.textBaseline = 'top';
        ctx.fillText(txt, x, ly - 3);
      });
    });


    // ctx.restore();
    //
    // if (!this.introDone) return;
    /* ---------- portrait with native size (no stretching) -------------- */
    const { portrait } = ABOUT;          // still keep misc settings here
    /* lazy-load once */
    if (!portrait.bmp) {
      portrait.bmp = new Image();
      portrait.bmp.src = 'assets/images/IsaacHu.jpg';
      portrait.bmp.onload = () => canvas.dispatchEvent(new Event('redraw'));
    }
    /* bail if not ready yet */
    if (!portrait.bmp.complete) return;
    /* natural dimensions straight from file */

    /* ─── progress toward 0/1 for filter & frame shift ───────── */
    if (this.portraitHover)
      this.portraitProg = Math.min(1, this.portraitProg + PORTRAIT_ANIM.speed);
    else
      this.portraitProg = Math.max(0, this.portraitProg - PORTRAIT_ANIM.speed);
    const pT = AboutCanvas.ease(this.portraitProg);    // 0‒1

    /* natural size --------------------------------------------------------- */
    const SCALE = ABOUT.portraitScale;
    const W = portrait.bmp.naturalWidth  * SCALE;
    const H = portrait.bmp.naturalHeight * SCALE;

    /* position ------------------------------------------------------------- */
    const imgX = canvas.width / dpr - W - ABOUT.marginX + ABOUT.imageRightShift;
    const imgY = pageY + ABOUT.top;

    /* save bbox for next onMove() call */
    this.portraitBox = { x: imgX, y: imgY, w: W, h: H };

    /* --------------------------------------------------------------------- */
    ctx.save();
    ctx.translate(imgX, imgY);

    /* -- 2.  cyan frame – shifts but picture stays put -------------------- */
    const s = PORTRAIT_ANIM.shift * pT;        // current offset
    ctx.lineWidth   = 2;
    ctx.strokeStyle = COLORS.cyan;
    strokeRoundRect(
        ctx,
        -portrait.borderOffset + 50 - s,         // x
        -portrait.borderOffset + 50 - s,         // y
        W, H, 3
    );

    /* -- 1.  draw the picture (colour fades back to normal) --------------- */
    const g   = 100 * (1 - pT);                // grayscale 100 → 0
    const br  =  60 + 40  * pT;                // brightness 60 → 100
    const ct  = 120 - 20  * pT;                // contrast   120 → 100
    const sp  = 100 * (1 - pT);                // sepia      100 → 0
    const hr  = 145 * (1 - pT);                // hue-rotate 145 → 0
    const sat = 500 - 400 * pT;                // saturate   500 → 100
    ctx.filter =
        `grayscale(${g}%) brightness(${br}%) contrast(${ct}%) ` +
        `sepia(${sp}%) hue-rotate(${hr}deg) saturate(${sat}%)`;

    ctx.drawImage(portrait.bmp, 0, 0, W, H);
    ctx.filter = 'none';                       // reset for the frame


    this.linkHover = this.buLink.hover;
    ctx.restore();
    ctx.restore();
  }
}
