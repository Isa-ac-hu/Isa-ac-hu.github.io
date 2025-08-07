//introStage.js
import { polygonPoints, lerpHex, resizeHiDPI, convert, convertInt, PROJECT_LIST } from '../utils.js';


export let COAST_LINES = [];

let COAST_PROMISE;
export function loadCoast() {
  if (COAST_PROMISE) return COAST_PROMISE;
  COAST_PROMISE = fetch('./src/assets/Maps/ne_50m_coastline.json')
    .then(res => res.json())
    .then(({ features }) => {
      features.forEach(({ geometry }) => {
        if (geometry.type === 'LineString') {
          COAST_LINES.push(geometry.coordinates);
        } else {
          geometry.coordinates.forEach(line => COAST_LINES.push(line));
        }
      });
    });
  return COAST_PROMISE;
}

export default class IntroStage {
  constructor(canvas, onFinish = () => {}) {

    loadCoast();                      // map coastline JSON

    PROJECT_LIST.forEach(p => {
      if (p.frames) {
        // a little array of Image objects for your BuildCanvas
        p.framesArr = Array.from({ length: p.frames.count }, (_, i) => {
          const img = new Image();
          img.src = `./src/assets/gifs/${p.frames.dir}` +
            String(i).padStart(3, '0') +
            p.frames.ext;
          return img;
        });
        // record when we “could” start stepping through them
        p.startTime = performance.now();
      }
      else if (p.img && /\.gif$/i.test(p.img)) {
        // for raw .gif files, also fetch them now
        p.animGif = new Image();
        p.animGif.src = `./src/assets/gifs/${p.img}`;
        // (optional) you can snapshot a still frame here too:
        p.animGif.onload = () => {
          const off = document.createElement('canvas');
          off.width  = p.animGif.naturalWidth;
          off.height = p.animGif.naturalHeight;
          off.getContext('2d').drawImage(p.animGif, 0, 0);
          p.stillBmp = new Image();
          p.stillBmp.src = off.toDataURL();
        };
      }
    });
    /* ---------- setup ---------- */
    const ctx = canvas.getContext('2d');
    resizeHiDPI(canvas, ctx);
    const dpr = window.devicePixelRatio || 1;

    const cssW = canvas.width  / dpr;
    const cssH = canvas.height / dpr;

    const CYAN = 'rgba(100,255,218,1)';
    const BG1 = '#020C1B';
    const BG2 = '#0A192F';
    const SIZE = 0.05;
    const LETTER_FADE = 0.02;
    const LOG_K = 10;

    let bgProg = 0;
    const BG_FADE_STEP = 0.01;

    /* helper – returns interpolated #rrggbb  */
    const mixBG = () => lerpHex(BG1, BG2, easeLogistic(bgProg));

    const L0 = 1 / (1 + Math.exp( LOG_K / 2));
    const L1 = 1 / (1 + Math.exp(-LOG_K / 2));
    const easeLogistic = x => {
      const y = 1 / (1 + Math.exp(-LOG_K * (x - 0.5)));
      return (y - L0) / (L1 - L0);
    };

    /* geometry & state (unchanged names) */
    let prog = 0, letterAlpha = 0, done = false;
    const STEP = 0.01, SHRINK_STEP = 0.01, VANISH_AT = 0.01;
    let scale = 1, shrinkProg = 0, currentBG = BG1;

    const SIDES = 6;
    // always center in CSS‐px
    const center = () => [cssW / 2, cssH / 2];
    const polygonPoints = () => {
      // radius in CSS‐px, based on the smaller dimension
      const [cx, cy] = center(), r = Math.min(cssW, cssH) * SIZE;
      const pts = [];
      for (let i = 0; i < SIDES; i++) {
        const ang = (-90 - i * 360 / SIDES) * Math.PI/180;
        pts.push([ cx + r*Math.cos(ang), cy + r*Math.sin(ang) ]);
      }
      return pts;
    };
    let points = polygonPoints();
    window.addEventListener('resize', () => { points = polygonPoints(); });

    /* main loop */
    const frame = () => {
      if (prog < 1) prog += STEP;
      else if (letterAlpha < 1) letterAlpha += LETTER_FADE; // ‘I’ fades in
      else if (shrinkProg  < 1)  shrinkProg   += SHRINK_STEP; // logo shrinks
      if (shrinkProg >= 1 && bgProg < 1) {
        bgProg = Math.min(1, bgProg + BG_FADE_STEP);
        if (bgProg === 1) { // cross-fade complete
          onFinish(); // hand off to HomeStage
          return; // stop the intro loop
        }
      }

      scale = 1 - easeLogistic(Math.min(shrinkProg, 1));
      /* clear & paint interpolated background */
      ctx.fillStyle = mixBG();
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth=5; ctx.strokeStyle=CYAN; ctx.lineCap='round'; ctx.globalAlpha=1;
      const scaled = ([x,y]) => {
        const [cx,cy] = center();
        return [cx + (x-cx)*scale, cy + (y-cy)*scale];
      };

      if (scale > VANISH_AT) {
        ctx.beginPath();
        const eased = easeLogistic(prog);
        const total = eased * SIDES;
        const full = Math.floor(total);
        const frac = total - full;

        for (let i=0;i<full;i++){
          const [x1,y1]=scaled(points[i]), [x2,y2]=scaled(points[(i+1)%SIDES]);
          ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
        }
        if (full<SIDES){
          const [sx,sy]=scaled(points[full]), [ex,ey]=scaled(points[(full+1)%SIDES]);
          const px=sx+(ex-sx)*frac, py=sy+(ey-sy)*frac;
          ctx.moveTo(sx,sy); ctx.lineTo(px,py);
        }
        ctx.stroke();
      }

      if (prog>=1 && scale>VANISH_AT){
        const [cx,cy]=center();
        ctx.font='bold ' + 60 * scale + 'px "Arial", monospace';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.globalAlpha=letterAlpha; ctx.fillStyle=CYAN;
        ctx.fillText('胡',cx,cy+(5)*scale);
      }
      requestAnimationFrame(frame);
    };
    frame();  //starts animation
  }
}
