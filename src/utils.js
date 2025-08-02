/* utils.js – shared helpers & constants */

export function strokeRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.stroke();
}

/* reusable hexagon vertex generator */
export function polygonPoints(radius, sides = SIDES) {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const ang = (-90 - i * 360 / sides) * Math.PI / 180;
    pts.push([Math.cos(ang) * radius, Math.sin(ang) * radius]);
  }
  return pts;
}

/* convenience hit‑test helper */
export function isLogoHit(cssX, cssY) {
  return (
    cssX >= LOGO_BOUNDS.left  && cssX <= LOGO_BOUNDS.right &&
    cssY >= LOGO_BOUNDS.top   && cssY <= LOGO_BOUNDS.bottom
  );
}

/* optional: a tiny logistic easing if more stages need it */
export function easeLogistic(x, k = 10) {
  const L0 = 1 / (1 + Math.exp( k / 2));
  const L1 = 1 / (1 + Math.exp(-k / 2));
  const y  = 1 / (1 + Math.exp(-k * (x - 0.5)));
  return (y - L0) / (L1 - L0);
}

/* linear‑interpolate two #rrggbb colours, 0 ≤ t ≤ 1 */
export function lerpHex(c1, c2, t) {
  const a = parseInt(c1.slice(1), 16);
  const b = parseInt(c2.slice(1), 16);
  const r = a >> 16,         g = (a >> 8) & 255,  bl = a & 255;
  const R = b >> 16,         G = (b >> 8) & 255,  B  = b & 255;
  const rr = Math.round(r + (R - r) * t);
  const gg = Math.round(g + (G - g) * t);
  const bb = Math.round(bl+ (B - bl) * t);
  return `rgb(${rr},${gg},${bb})`;
}

//############################################################################


/* central place for design constants */

export const LOGO = {
    anchor: { x: 70, y: 50 },   // where the mini‑logo is drawn
    size   : { w: 45,  h: 45 },                 // click zone width/height in CSS‑px
    scale : 0.018,              // radius factor (r = min(vw,vh)*scale)
};

export const COLORS = {
    cyan   : 'rgba(100,255,218,1)',        // bright mint
    bgDark : '#0A192F',
    bgDeep : '#020C1B',
    light  : 'rgba(204,214,246,1)',   // name + headline lines
    gray   : 'rgba(136,146,176,1)',   // paragraph + nav labels
    gray15 : 'rgba(136,146,176,.15)',   // translucent for hit‑boxes / line
};



/* derived bounds — computed once & cached */
const halfW = LOGO.size.w / 2, halfH = LOGO.size.h / 2;
export const LOGO_BOUNDS = {
    left   : LOGO.anchor.x - halfW,
    right  : LOGO.anchor.x + halfW,
    top    : LOGO.anchor.y - halfH,
    bottom : LOGO.anchor.y + halfH,
};



/* number of sides is the same everywhere */
export const SIDES = 6;

export const HEADER = {
  offsetX : 0,        // future slide‑out, keep 0 for now
  offsetY : 0,
  gap     : 2,       // horizontal gap between nav items
  innerPad : 13,
  numToLabel : 4,
  rightShift : 70,
  resumeW : 80,      // Resume button outer width
  resumeH : 40,       // Resume button outer height
  font    : '13px "SF Mono Regular", monospace',
  resumeRadius: 6,    // corner radius for the rounded outline
  resumeDistance: 20,
};

/* hero button geometry (CSS px in the design coordinate‑system) */
export const HERO_BTN = {
    x : 320,          // left‑edge (same margin as the “Hi, my name is”)
    y : 600,          // fine‑tune after you see it live
    w : 160,
    h : 56,
    label : 'Get In Touch',
    mail  : 'mailto:isaac.hu002@gmail.com',
    connectRadius: 6,
};

/* fixed social‑bar geometry (CSS‑px) */
export const SOCIAL = {
  x      : 70,     // left margin ─ same as mini‑logo
  top    : 600,    // tweak until it matches your design
  size   : 20,     // width & height of icon cells
  gap    : 25,     // vertical gap between icons
  lift   : 4,      // how much the icon rises on hover
  lineH  : 200,    // length of the grey line below the last icon

  icons: [
    {
      id      : 'gh',           // default svg  →  assets/icons/gh.svg
      hoverId : 'gh-teal',      // hover svg    →  assets/icons/gh‑teal.svg
      url     : 'https://github.com/yourUsername'
    },
    {
      id      : 'ln',
      hoverId : 'ln-teal',
      url     : 'https://www.linkedin.com/in/isaac-hu-195696249/'
    },
    {
      id      : 'ig',
      hoverId : 'ig-teal',
      url     : 'https://www.instagram.com/isaac__hu/'
    },
    {
      id      : 'tw',
      hoverId : 'tw-teal',
      url     : 'https://twitter.com/yourHandle'
    }
  ],
};

/* fixed mail‑bar geometry (CSS‑px) */
export const MAIL = {
  email : 'isaac.hu002@gmail.com',
  x     : 57,          // distance from the right edge (same as social bar from left)
  top   : 540,         // matches SOCIAL.top so the two bars are aligned
  gap   : 40,          // vertical space between characters
  lineH : 200,          // vertical line below the last character
  lineGap: 20 //gap between email and line
};

export const ABOUT = {
  marginX : 365,          // same lateral margin you gave Hero
  top     : 100,          // distance from the top of its page
  maxW    : 500,         // paragraph wrap‑width
  ruleGap : 10,          // vertical align of the grey rule
  paraLH  : 30,          // paragraph line‑height
  skillLH : 26,          // list line‑height
  colW    : 230,         // width of each skill column
  /* portrait geometry (optional) */
  imgW : 340,
  imgH : 340,
  portrait : { borderOffset : 12, bmp : null },

  colGap    : 150,    // space from one skill-column to the next
  firstColY : 0,      // extra vertical offset after paragraphs

  lineLength: 300,
  rightShiftBullets: 20,

  portraitScale : 0.1,     // 60 % of original width / height

  imageRightShift: 100,
};

export const BULLET = {
  pad   : 18,   // distance from the skill text to the left-most point
  size  : 3,   // length of each triangle side (≈ the height as well)
  width : 2     // stroke thickness
};


export const SKILL_GROUPS = {
  /* left column */
  Languages : [
    'Python', 'Java', 'C / C++', 'C#', 'R',
    'JavaScript', 'SQL', 'Bash', 'Verilog',
    'HTML / CSS'
  ],

  /* right column */
  Frameworks_Tools : [
    'React', 'Flutter', 'Firebase', 'AWS Lambda', 'Flask',
    'NumPy / Pandas', 'Power BI', 'SAP',
    'Power Automate', 'Git'
  ],

  /* optional third column – comment out if you don’t want it */
  Practices : [
    'Agile (Scrum)', 'SOLID OOP', 'Object Oriented Design Patterns',
    'REST API Design', 'Linux Tool-chain'
  ]
};

export const GLOBE_BOX = {
  top  : 250,          // distance from top of its page
  left : 300,          // left margin
  size : 500,          // outer square (px)

  COORDINATE : [],
};



export const INFO_PANEL = {
  left : 1050,   // distance from the left edge of the canvas / page
  top  : 1970,   // distance from the top
  w    : 320,   // max width  (img will auto-scale to this)
};

