/* utils.js */
/*#############################FUNCTIONS GO HERE###################################*/

export function resizeHiDPI(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1;
  const { width: cssW, height: cssH } = canvas.getBoundingClientRect();
  if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

export function bezierXY(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  const x = uuu * p0[0] + 3 * uu * t * p1[0] + 3 * u * tt * p2[0] + ttt * p3[0];
  const y = uuu * p0[1] + 3 * uu * t * p1[1] + 3 * u * tt * p2[1] + ttt * p3[1];
  return [x, y];
}

export function wrap(ctx, txt, x, y, maxW, lh) {
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
  return cy + lh;
}

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

export function hideHeader () {
  /* canvas and blur strip both use fixed IDs, so we can just query */
  const glass = document.getElementById('header-glass');
  if (glass) glass.style.display = 'none';

  const headerCanvas = document.querySelector('canvas#headerCanvas');
  if (headerCanvas) headerCanvas.style.display = 'none';
}

export function showHeader () {
  const glass = document.getElementById('header-glass');
  if (glass) glass.style.display = 'block';

  const headerCanvas = document.querySelector('canvas#headerCanvas');
  if (headerCanvas) headerCanvas.style.display = 'block';
}

export function ensureHeaderGlass(height = 72) {
  if (document.getElementById('header-glass')) return;   // already present

  const glass = document.createElement('div');
  glass.id = 'header-glass';
  Object.assign(glass.style, {
    position        : 'fixed',
    inset           : '0 0 auto 0',     // top, full-width
    height          : `${height}px`,
    backgroundColor : 'rgba(10,25,47,0.85)',
    backdropFilter  : 'blur(10px)',
    WebkitBackdropFilter : 'blur(10px)', // Safari
    zIndex          : '5',               // below canvas (see note)
    pointerEvents   : 'none'
  });
  document.body.appendChild(glass);
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
    cssX >= LOGO_BOUNDS.left && cssX <= LOGO_BOUNDS.right &&
    cssY >= LOGO_BOUNDS.top && cssY <= LOGO_BOUNDS.bottom
  );
}

export function easeLogistic(x, k = 10) {
  const L0 = 1 / (1 + Math.exp( k / 2));
  const L1 = 1 / (1 + Math.exp(-k / 2));
  const y = 1 / (1 + Math.exp(-k * (x - 0.5)));
  return (y - L0) / (L1 - L0);
}

/* linear‑interpolate two #rrggbb colours, 0 ≤ t ≤ 1 */
export function lerpHex(c1, c2, t) {
  const a = parseInt(c1.slice(1), 16);
  const b = parseInt(c2.slice(1), 16);
  const r = a >> 16, g = (a >> 8) & 255,  bl = a & 255;
  const R = b >> 16, G = (b >> 8) & 255,  B  = b & 255;
  const rr = Math.round(r + (R - r) * t);
  const gg = Math.round(g + (G - g) * t);
  const bb = Math.round(bl + (B - bl) * t);
  return `rgb(${rr},${gg},${bb})`;
}

//####################################CONSTANTS GO HERE########################################
// let width = window.innerWidth; //1638
// let height = window.innerHeight; //1024

let width = 1638/2;
let height = 863/2;

// const DESIGN_WIDTH = 1638;
// const DESIGN_HEIGHT = 850;

const DESIGN_WIDTH = 1638;
const DESIGN_HEIGHT = 863;

const scale = Math.min(
  width / DESIGN_WIDTH,
  height / DESIGN_HEIGHT
);

export function getScale(){
  return scale;
}
export function convert(designValue){
  return designValue * scale;
}
export function convertInt(designValue){
  return Math.round(designValue * scale);
}

export function sectionY(multiplier) {
  // “multiplier” is 1 for page 1, 2 for page 2, 6.2 for page 6.2, etc
  return convert(DESIGN_HEIGHT * multiplier);
}


export const COLORS = {
  cyan   : 'rgba(100,255,218,1)',
  bgDark : '#0A192F',
  bgDeep : '#020C1B',
  light  : 'rgba(204,214,246,1)',
  gray   : 'rgba(136,146,176,1)',
  gray15 : 'rgba(136,146,176,.15)',
};

/* central place for design constants */

export const LOGO = {
  anchor: { x: 70, y: 50 },  // where the mini‑logo is drawn
  size: { w: 45, h: 45 }, // click zone width/height in CSS‑px
  scale: 0.022, // radius factor (r = min(vw,vh)*scale)
};

/* derived bounds — computed once & cached */
const halfW = LOGO.size.w / 2, halfH = LOGO.size.h / 2;
export const LOGO_BOUNDS = {
    left: LOGO.anchor.x - halfW,
    right: LOGO.anchor.x + halfW,
    top: LOGO.anchor.y - halfH,
    bottom: LOGO.anchor.y + halfH,
};

/* number of sides is the same everywhere */
export const SIDES = 6;
export const HEADER = {
  offsetX: 0, // future slide‑out, keep 0 for now
  offsetY: 0,
  gap: 2, // horizontal gap between nav items
  innerPad: 13,
  numToLabel: 4,
  rightShift: 70,
  resumeW: 80, // Resume button outer width
  resumeH: 40, // Resume button outer height
  font: 13 + 'px "SF Mono Regular", monospace',
  resumeRadius: 6, // corner radius for the rounded outline
  resumeDistance: 20,
};

export const RESUME_URL =
  './src/assets/resumes/Isaac%20Hu%20Resume.pdf';

/* hero button geometry (CSS px in the design coordinate‑system) */
export const HERO_BTN = {
  x: convert(320),  // left‑edge (same margin as the “Hi, my name is”)
  y: convert(540),
  w: convert(160),
  h: convert(56),
  label: 'Get In Touch',
  mail: 'mailto:isaac.hu002@gmail.com',
  connectRadius: convert(6),
};

/*Hero intro animation */
export const HERO_ANIM = {
  delay: 0.5, // seconds AFTER the header completes
  stagger: 0.35, // delay between successive hero lines
  dropPx: convert(30), // start-offset below baseline
  speed: 0.03 // timer advance per frame
};

/* fixed social‑bar geometry (CSS‑px) */
export const SOCIAL = {
  x: 70, // left margin ─ same as mini‑logo
  top: 300,
  size: 20, // width & height of icon cells
  gap: 25, // vertical gap between icons
  lift: 4, // how much the icon rises on hover
  lineH: 200,  // length of the grey line below the last icon

  icons: [
    {
      id: 'gh',
      hoverId: 'gh-teal',
      url: 'https://github.com/Isa-ac-hu'
    },
    {
      id: 'ln',
      hoverId: 'ln-teal',
      url: 'https://www.linkedin.com/in/isaac-hu-195696249/'
    },
    {
      id: 'ig',
      hoverId: 'ig-teal',
      url: 'https://www.instagram.com/isaac__hu/'
    },
    {
      id: 'strava',
      hoverId: 'strava-teal',
      url: 'https://www.strava.com/athletes/67985759'
    },
  ],
};

export const MAIL = {
  email: 'isaac.hu002@gmail.com',
  x: 57, // distance from the right edge (same as social bar from left)
  top: 350,  // matches SOCIAL.top so the two bars are aligned
  gap: 40, // vertical space between characters
  lineH: 200, // vertical line below the last character
  lineGap: 40, //gap between email and line
};

export const ABOUT = {
  marginX: convert(365),
  top: convert(100), // distance from the top of its page
  maxW: convert(500), // paragraph wrap‑width
  ruleGap: convert(17), // vertical align of the grey rule
  paraLH: convert(30), // paragraph line‑height
  skillLH: convert(26), // list line‑height
  colW: convert(230), // width of each skill column
  /* portrait geometry (optional) */
  imgW: convert(340),
  imgH: convert(340),
  portrait: { borderOffset : convert(12), bmp : null },

  colGap: convert(150), // space from one skill-column to the next
  firstColY: convert(0), // extra vertical offset after paragraphs
  lineLength: convert(300),
  rightShiftBullets: convert(20),
  portraitScale: convert(0.1), // 60 % of original width / height
  imageRightShift: convert(100),
};

export const BULLET = {
  pad: convert(18), // distance from the skill text to the left-most point
  size: convert(3), // length of each triangle side
  width: convert(2), // stroke thickness
};

export const SKILL_GROUPS = {
  /* left column */
  Languages: [
    'Python', 'Java', 'C / C++', 'C#', 'R',
    'JavaScript', 'SQL', 'Bash', 'Verilog',
    'HTML / CSS'
  ],
  /* right column */
  Frameworks_Tools: [
    'React', 'Flutter', 'Firebase', 'AWS Lambda', 'Flask',
    'NumPy / Pandas', 'Power BI', 'SAP',
    'Power Automate', 'Git'
  ],
  Practices: [
    'Agile (Scrum)', 'SOLID OOP', 'Object Oriented Design Patterns',
    'REST API Design', 'Linux Tool-chain'
  ]
};

export const BAR_ANIM = {
  delay: 0.5, // seconds after hero completes
  speed: 0.03, // logistic input advance per frame
};

/*  small portrait-hover animation  */
export const PORTRAIT_ANIM = {
  speed: 0.08,
  shift: convert(12)
};

/*work*/
export const WORK = {
  top: convert(200), // distance from its page-top
  marginX: convert(465),
  ruleGap: convert(0),
  maxW: convert(620), // right column paragraph width
  rowH: convert(50), // vertical spacing between job names
  barW: convert(2), // cyan bar thickness
  barH: convert(50), // cyan bar height
  padX: convert(16), // gap between bar and job label
  hitShift: convert(10),
  buttonSize: convert(200),
  labelW: convert(200),
  labelPadX: convert(14), // horizontal padding inside the swatch
  labelPadY: convert(6),        // vertical padding
  hlPad: convert(0),
};

/*Jobs*/
export const JOBS = [
  {
    company: 'Church & Dwight',
    title: 'IT Analyst Intern',
    date: 'May 2024 – Dec 2024',
    website: 'https://churchdwight.com',
    bullets: [
      'Built end-to-end automation pipeline for purchase-order processing with Power Automate and Python, routing hundreds of special-format PDF contracts',
      'Used K-means clustering in R to uncover consumer insights and desires from a laundry product survey, utilizing CRISP-DM methodology to help support data driven business decisions',
      'Authored Selenium automation test suites for 20 ServiceNow forms, checking for unintended behaviors',
    ]
  },
  {
    company: 'Carpenter Technology',
    title: 'Digital Technology Intern',
    date: 'May 2023 – Aug 2023',
    website: 'https://www.carpentertechnology.com',
    bullets: [
      'Analyzed iron-production process data in Python; applied receiver operating characteristic analysis to find factors associated with coarse grain steel, using base model of random forest',
      'Mined SAP plant-maintenance data with Pandas and Power BI, building algorithms to better inform spot-buys and reduce aging of inventory in warehouse'
    ]
  },

  {
    company: 'Boston University',
    title: 'Course Staff',
    date: 'Jan 2023 – May 2025',
    website: 'https://www.bu.edu',
    /* each role is an object with its own sub-bullets */
    bullets: [
      {
        role: 'Teaching Assistant — CS210 Computer Systems (Sept 2024 – May 2025)',
        desc: [
          'Instruct two-hour weekly labs for 250 students on digital logic design, C, x86-64 assembly, cache hierarchies',
          'Built containerised autograder (Python + pytest) that compiles binaries, runs differential checks, and posts results to Gradescope;',
        ]
      },
      {
        role: 'Course Assistant — CS237 Fundamentals of Statistics (Jan 2023 - May 2024)',
        desc: [
          'Collaborate with staff on course material and assessment design',
          'Co-teach discussions, hold office hours, grade, and proctor exams'
        ]
      },
      {
        role: 'Grader — CS330 Algorithm Analysis (Jan 2023 - May 2023)',
        desc: [
          'Grade proofs and algorithm-design assignments; give written feedback'
        ]
      },
    ]
  },
  {
    company: 'Gravic Inc',
    title: 'Programming Intern',
    date: 'May 2022 – Jul 2022',
    website: 'https://www.gravic.com',
    bullets: [
      'Worked in Power BI to create interactive visuals and models for sales database to be used by the sales team, utilizing DAX scripting to format and derive values from collected data',
      'Wrote visual basic software and bash scripts for parsing and modifying Optical Mark Recognition forms to test company scanners'
    ]
  }
];

/* animation for the selector bar */
export const WORK_ANIM = {
  speed: 0.08,
  shift: convert(22), // px the bar slides when switching
  barEase: convert(0.14)
};

export const NAV_ANIM = {
  speed: 0.03, // global timer advance per frame  (0-1)
  stagger: 0.35, // delay between successive items
  dropPx:  convert(30) // start-offset above baseline
};

/* Projects */
export const BUILDS = { /* section header */
  top: convert(200), // distance from page-top
  marginX: convert(310), // global left margin
  ruleGap: convert(-10), // grey rule alignment
  cornerR: convert(6), // card corner radius
  ghSize: convert(28), // GitHub icon size
};

let startX1 = convert(490);
let startY1 = convert(330);

let startX2 = convert(-510);
let startY2 = convert(330);

let startX3 = convert(490);
let startY3 = convert(330);

let startX4 = convert(-510);
let startY4 = convert(330);

export const BUILD_CURVES = [
  /* each curve starts well off-screen and ends at (0,0) */
  [[startX1-convert(480),startY1-convert(320)],[startX1-convert(320),startY1-convert(420)],[startX1-convert(140),startY1-convert(90)],[startX1,startY1]],   // project 0
  [[ startX2+convert(480),startY2-convert(320)],[ startX2+convert(320),startY2-convert(420)],[ startX2+convert(140),startY2-convert(90)],[startX2,startY2]],   // project 1
  [[startX3-convert(480),startY3-convert(320)],[startX3-convert(320),startY3-convert(420)],[startX3-convert(140),startY3-convert(90)],[startX3,startY3]],   // project 2
  [[ startX4+convert(480),startY4-convert(320)],[ startX4+convert(320),startY4-convert(420)],[ startX4+convert(140),startY4-convert(90)],[startX4,startY4]],   // project 3
];

export const PROJECT_LIST = [
  {
    title: 'Ball Balancing PID Embedded System',
    tagline: 'Featured Project',
    blurb:
      'Closed loop PID controller programmed in C on a Microchip dsPIC33 that can balance a ball on the center of a platform, filtering noisy signals using a 2nd order Butterworth filter.',
    tech: ['dsPIC33', 'C', 'PID', 'UART'],
    img: 'AmazingBallSystem.jpg',
    repo: 'https://github.com/Isa-ac-hu/PID-Controller',

    align: 'right',

    imgPos: { x: convert(0), y: convert(0), w: convert(580), h: convert(320) },
    card: { x: convert(520), y: convert(90), w: convert(500), h: convert(120) },
    ghPos: { x: convert(990), y: convert(250) }
  },

  {
    title: 'Tetris Playing Autonomous Agent',
    tagline: 'Featured Project',
    blurb: 'A script written in Java, using Q-learning with a heuristic emphasizing the minimization gaps between blocks and total height. It learned how to stay alive in Tetris indefinitely after training for 48 hours, in 2000 trials.',
    tech: [ 'Java' ],
    img: 'Tetris.gif',
    repo: 'https://github.com/Isa-ac-hu/Tetris-Q-Learning-Agent',

    align: 'left',

    frames: {
      dir: 'Tetris/frame_',
      ext: '.png',
      count: 65, // how many numbered frames
      fps: 10 // 100 ms per frame  (count * fps ~= 6 s loop)
    },
    imgPos: { x: convert(420), y: convert(500),  w: convert(580), h: convert(320) }, // picture on the right
    card: { x: convert(0), y: convert(580), w: convert(500), h: convert(120) }, // text on the left
  },
  {
    title: 'Flutter Scheduling App',
    tagline: 'Featured Project',
    blurb:
      'App that gradually learns a persons\'s habits, and algorithmically deduces the amount of time they need to get ready to better plan their day. Integrated with google maps and calendar.',
    tech: ['Flutter', 'Firebase', 'Google Calendar', 'Google Authentication'],
    img: 'Timo.png',
    repo: 'https://github.com/Isa-ac-hu/Timo',
    align: 'right',
    imgPos: { x: convert(300), y: convert(1000), w: convert(150), h: convert(320) },
    card: { x: convert(520), y: convert(1080), w: convert(500), h: convert(120) },
    ghPos: { x: convert(990), y: convert(250) }
  },
  {
    title: 'Arduino Robot',
    tagline: 'Featured Project',
    blurb: 'Robot powered by a small arduino computer, with activatable motors, infrared sensors, and speakers. Made to greet people.',
    tech: [ 'Arduino', 'C', 'Circuit Design' ],
    img: 'Arduino.gif',
    repo: 'https://github.com/Isa-ac-hu/Arduino-Robot',
    align: 'left',
    frames: {
      dir: 'Arduino/frame_',
      ext: '.png',
      count: 65,
      fps: 10
    },
    imgPos: { x: convert(420), y: convert(1500), w: convert(580), h: convert(320) }, // picture on the right
    card: { x: convert(0), y: convert(1580), w: convert(500), h: convert(120) }, // text on the left
  },
];

/*Other Projects*/
export const NOTEWORTHY = {
  top: convert(130), // distance from page-top of *this* section
  marginX: convert(430), // global left margin (looks centred under header)
  gap: convert(40), // px between cards (both x & y)
  cardW: convert(375),
  cardH: convert(235),
  cornerR: convert(6),
  liftPx: convert(10), // how far a card rises on hover
  speed: 0.08, // logistic input advance per frame
  ghSize: convert(24),
  iconGap: convert(18) // distance folder→GH→external
};

export const NOTE_LIST = [
  {
    title: 'Paper on Quantum Random Walks',
    desc: 'Report analyzing the behavior and novel use cases of random walks using quantum computers',
    tech: ['Quantum Computing'],
    url: './src/assets/PDF/Paper on Quantum Random Walks.pdf'
  },
  {
    title: 'Paper on Information Cascades',
    desc: 'In depth analysis on the way information propagates through wikipedia articles',
    tech: ['Python', 'Beautiful Soup', 'Data Mining'],
    url: './src/assets/PDF/Paper on Information Cascades.pdf'
  },
  {
    title: 'Presentation on the History of English',
    desc: 'Presented to the Boston University history club',
    tech: ['History'],
    url: './src/assets/PDF/History of English.pdf'
  },
  {
    title: 'Schubert\'s Piano Trio No. 1 in B-Flat',
    desc: 'I played the cello part!',
    tech: ['Cello'],
    url: 'https://youtu.be/uOSbVwMUbJo'
  }
];

export const GLOBE_BOX = {
  top: convert(400), // distance from top of its page
  left: convert(300), // left margin
  size: convert(500), // outer square (px)
  COORDINATE: [],
};

export const INFO_PANEL = {
  left: convert(1050), // distance from the left edge of the canvas / page
  top: GLOBE_BOX.top + convert(6.15) * window.innerHeight,
  w: convert(320), // max width
};