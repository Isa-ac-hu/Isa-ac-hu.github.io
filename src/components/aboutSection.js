/* aboutCanvas.js*/
import { BULLET, COLORS, ABOUT, strokeRoundRect, SKILL_GROUPS, PORTRAIT_ANIM, easeLogistic, convert, convertInt, getScale } from '../utils.js';

export default class AboutCanvas{
  constructor(ctx,canvas){
    this.ctx = ctx;
    this.canvas = canvas;
    this.introStarted = false;   // check to see if we have activated the animation
    this.introDone = false;   // when the animation is completed, we don't run it again
    this.introTimer = 0;       // counts to 1, used for our logistic curve
    this.INTRO_SPEED = 0.01;
    this.INTRO_DROP = 200;      // px it climbs while fading in
    const t = this.ctx.getTransform();
    this._dpr  = t && typeof t.a === 'number' ? t.a : (window.devicePixelRatio || 1);
    this._cssW = this.canvas.width  / this._dpr;
    this._cssH = this.canvas.height / this._dpr;

    /* run-time state for the "Boston University" link */
    this.buLink = {
      x:convert(0),y:convert(0),w:convert(0),h:convert(0),
      prog:0, //we also maintain a progress on the underline when you hover
      hover:false
    };

    /* run-time state for the portrait hover */
    this.portraitHover = false; // current pointer state
    this.portraitProg = 0; // 0‒1 logistic input (it moves and glows cyan)

    /* pointer listeners for our canvas */
    canvas.addEventListener('mousemove', this.onMove );
    canvas.addEventListener('click' , this.onClick);
  }
  /* our logistic progression for the link underlines */
  static ease(t,k=10){return 1/(1+Math.exp(-k*(t-.5)));}

  /* hit-test helper */
  inLink(cssX,cssY){
    const {x,y,w,h}=this.buLink;
    return cssX>=x && cssX<=x+w && cssY>=y && cssY<=y+h;
  }
  /* pointer handlers*/
  onMove = e =>{
    const r=this.canvas.getBoundingClientRect();
    const cssX=e.clientX-r.left, cssY=e.clientY-r.top;
    this.buLink.hover=this.inLink(cssX,cssY);

    // portrait hit test
    if (this.portraitBox) {
      const {x, y, w, h} = this.portraitBox;
      this.portraitHover = cssX >= x && cssX <= x+w && cssY >= y && cssY <= y+h;
    }
    this.canvas.style.cursor = ( this.buLink.hover || this.portraitHover ) ? 'pointer' : '';
  }

  onClick = ()=>{ if(this.buLink.hover) window.open('https://www.bu.edu/','_blank'); }

  /* paragraph word‑wrap */
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
    // Use frozen DPR/CSS size captured in constructor
    const dpr   = this._dpr;
    const cssH  = this._cssH;          // viewport height in CSS px (frozen)
    const offset= cssH * getScale();
    const { pad, size, width } = BULLET;

    //our bounds for the display
    if(scrollY<offset-cssH * getScale()||scrollY>offset+cssH * getScale())return;

    const pageY = offset-scrollY; // page‑top in canvas space

    /* trigger the intro the first time About becomes visible */
    if (!this.introStarted &&
      scrollY > offset - cssH * getScale() && scrollY < offset + cssH * getScale()) {
      this.introStarted = true;
    }

    /* after triggering logic */
    if (this.introStarted && !this.introDone) {
      this.introTimer = Math.min(1, this.introTimer + this.INTRO_SPEED);
      if (this.introTimer >= 1) this.introDone = true;
    }
    const easeT = easeLogistic(this.introTimer); // 0‒1 logistic progression
    const dropY = this.INTRO_DROP * (1 - easeT); // we start at INTRO_DROP, and rise to our actual position
    const alphaT = easeT;
    const baseX = ABOUT.marginX;
    let y = pageY+ABOUT.top;

    ctx.save();
    ctx.translate(0, dropY); // rise up
    ctx.globalAlpha = alphaT; // logistic fade-in

    /* cyan index with text 01. */
    ctx.fillStyle=COLORS.cyan;

    ctx.font = convertInt(24) + 'px "SF Mono Regular", monospace';
    ctx.textAlign='left';ctx.textBaseline='top';
    ctx.fillText('01.',baseX,y + convert(8));
    const idxW=ctx.measureText('01.').width+convert(8);

    /* heading text */
    ctx.fillStyle=COLORS.light;
    ctx.font ='bold ' + convertInt(36) + 'px "Calibre", sans-serif';
    ctx.fillText('About Me',baseX+idxW,y);

    /* grey horizontal rule */
    ctx.strokeStyle=COLORS.gray+'66';ctx.lineWidth=0.5;
    ctx.beginPath();
    ctx.moveTo(baseX+idxW+convert(160),y+ABOUT.ruleGap);
    ctx.lineTo(baseX+idxW+convert(160) + ABOUT.lineLength,y+ABOUT.ruleGap);
    ctx.stroke();

    y+=convert(80);

    /* paragraphs */
    ctx.fillStyle=COLORS.gray;
    ctx.font = convertInt(20) + 'px "Calibre", sans-serif';
    y=this.wrap("I have a combined Bachelor of Arts/Master of Science in computer science from Boston University, completed in May 2025, with prominent coursework in embedded systems, statistics, machine learning, and software design.",baseX,y,ABOUT.maxW,ABOUT.paraLH);
    y=this.wrap("",baseX,y - convert(15),ABOUT.maxW,ABOUT.paraLH);
    y=this.wrap("Outside of school, I have done some internships and personal projects that have developed my understanding of many different facets of the computing world!",baseX,y,ABOUT.maxW,ABOUT.paraLH);
    y=this.wrap("",baseX,y - convert(15),ABOUT.maxW,ABOUT.paraLH);
    y=this.wrap("Here are some technologies that I've worked with across my various endeavors: ",baseX,y,ABOUT.maxW,ABOUT.paraLH);
    y=this.wrap("",baseX,y - convert(15),ABOUT.maxW,ABOUT.paraLH);
    /* skill groups */

    /* highlight “Boston University” word manually */
    const buText= 'Boston University';
    ctx.font = convertInt(20) + 'px "Calibre", sans-serif';
    const pre = 'I have a combined Bachelor of Arts/Master of Science in computer science from ';
    const preWb = ctx.measureText(pre).width;
    const buW = ctx.measureText(buText).width;
    const linkX = baseX + convert(182);
    const linkY = (offset-scrollY) + ABOUT.top + convert(80) + convert(30); // same paragraph Y with some adjustment
    /* store bounding box once (for hit-testing) */
    Object.assign(this.buLink,{x:linkX,y:linkY,w:buW,h:ABOUT.paraLH});
    /* progressive underline*/
    const SPEED=convert(0.05);
    if(this.buLink.hover) this.buLink.prog=Math.min(1,this.buLink.prog+SPEED);
    else this.buLink.prog=Math.max(0,this.buLink.prog-SPEED);
    const t = AboutCanvas.ease(this.buLink.prog);
    ctx.fillStyle = COLORS.cyan;
    ctx.fillText(buText,linkX,linkY);

    if (t > 0.01) { //only draw if you see progress
      ctx.strokeStyle = COLORS.cyan;
      ctx.lineWidth = convertInt(2);
      ctx.beginPath();
      ctx.moveTo(linkX, linkY + ABOUT.paraLH - convert(10));
      ctx.lineTo(linkX + buW*t , linkY + ABOUT.paraLH - convert(10));
      ctx.stroke();
    }

    ctx.font = convertInt(13) + 'px "SF Mono Regular", monospace';
    const groups = Object.values(SKILL_GROUPS);
    const maxRows = Math.max(...groups.map(g => g.length));
    const colGap = ABOUT.colGap;
    groups.forEach((list, col) => {
      list.forEach((txt, row) => {
        const x = baseX + col * colGap + ABOUT.rightShiftBullets;
        const ly = y + ABOUT.firstColY + row * ABOUT.skillLH;

        /* bullet points */
        const { pad, size, width } = BULLET;
        ctx.strokeStyle = COLORS.cyan;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(x - pad, ly + size * convert(0.1));
        ctx.lineTo(x - pad + size, ly + size * convert(0.5));
        ctx.lineTo(x - pad, ly + size * convert(0.9));
        ctx.closePath();
        ctx.stroke();

        /* label */
        ctx.fillStyle = COLORS.gray;
        ctx.textBaseline = 'top';
        ctx.fillText(txt, x, ly - convert(3));
      });
    });

    /* portrait  */
    const { portrait } = ABOUT;
    /* lazy-load once */
    if (!portrait.bmp) {
      portrait.bmp = new Image();
      portrait.bmp.src = './src/assets/images/IsaacHu.jpg';
      portrait.bmp.onload = () => canvas.dispatchEvent(new Event('redraw'));
    }
    /* bail if not ready yet */
    if (!portrait.bmp.complete) return;

    /* progress for portrait */
    if (this.portraitHover)
      this.portraitProg = Math.min(1, this.portraitProg + PORTRAIT_ANIM.speed);
    else
      this.portraitProg = Math.max(0, this.portraitProg - PORTRAIT_ANIM.speed);
    const pT = AboutCanvas.ease(this.portraitProg);

    /* natural size */
    const SCALE = ABOUT.portraitScale;
    const W = portrait.bmp.naturalWidth  * SCALE;
    const H = portrait.bmp.naturalHeight * SCALE;

    /* position */
    const imgX = canvas.width / dpr - W - ABOUT.marginX + ABOUT.imageRightShift;
    const imgY = pageY + ABOUT.top;

    /* save bound box for next onMove() call */
    this.portraitBox = { x: imgX, y: imgY, w: W, h: H };

    ctx.save();
    ctx.translate(imgX, imgY);

    /* cyan frame that shifts when hovered */
    const s = PORTRAIT_ANIM.shift * pT; //offset
    ctx.lineWidth = convertInt(2);
    ctx.strokeStyle = COLORS.cyan;
    strokeRoundRect(
        ctx,
        -portrait.borderOffset + convert(50) - s,
        -portrait.borderOffset + convert(50) - s,
        W, H, convert(3)
    );

    /* draw the picture */
    const g = 100 * (1 - pT); //grayscale
    const br =  60 + 40  * pT; // brightness
    const ct = 120 - 20  * pT; // contrast
    const sp = 100 * (1 - pT); // sepia
    const hr = 145 * (1 - pT); // hue-rotate
    const sat = 500 - 400 * pT; // saturate
    ctx.filter =
        `grayscale(${g}%) brightness(${br}%) contrast(${ct}%) ` +
        `sepia(${sp}%) hue-rotate(${hr}deg) saturate(${sat}%)`;

    ctx.drawImage(portrait.bmp, convert(0), convert(0), W, H);
    ctx.filter = 'none'; //reset to draw the frame

    this.linkHover = this.buLink.hover;
    ctx.restore();
    ctx.restore();
  }
}
