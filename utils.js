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
  size: { w: 45,  h: 45 }, // click zone width/height in CSS‑px
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
  font: '13px "SF Mono Regular", monospace',
  resumeRadius: 6, // corner radius for the rounded outline
  resumeDistance: 20,
};

export const RESUME_URL =
  'assets/resumes/Isaac%20Hu%20Resume.pdf';

/* hero button geometry (CSS px in the design coordinate‑system) */
export const HERO_BTN = {
  x: 320,  // left‑edge (same margin as the “Hi, my name is”)
  y: 540,
  w: 160,
  h: 56,
  label: 'Get In Touch',
  mail: 'mailto:isaac.hu002@gmail.com',
  connectRadius: 6,
};

/*Hero intro animation */
export const HERO_ANIM = {
  delay: 0.5, // seconds AFTER the header completes
  stagger: 0.35, // delay between successive hero lines
  dropPx: 30, // start-offset below baseline
  speed: 0.03 // timer advance per frame
};

/* fixed social‑bar geometry (CSS‑px) */
export const SOCIAL = {
  x: 70, // left margin ─ same as mini‑logo
  top: 600,
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
  top: 540,  // matches SOCIAL.top so the two bars are aligned
  gap: 40, // vertical space between characters
  lineH: 200, // vertical line below the last character
  lineGap: 20, //gap between email and line
};

export const ABOUT = {
  marginX: 365,
  top: 100, // distance from the top of its page
  maxW: 500, // paragraph wrap‑width
  ruleGap: 17, // vertical align of the grey rule
  paraLH: 30, // paragraph line‑height
  skillLH: 26, // list line‑height
  colW: 230, // width of each skill column
  /* portrait geometry (optional) */
  imgW: 340,
  imgH: 340,
  portrait: { borderOffset : 12, bmp : null },

  colGap: 150, // space from one skill-column to the next
  firstColY: 0, // extra vertical offset after paragraphs
  lineLength: 300,
  rightShiftBullets: 20,
  portraitScale: 0.1, // 60 % of original width / height
  imageRightShift: 100,
};

export const BULLET = {
  pad: 18, // distance from the skill text to the left-most point
  size: 3, // length of each triangle side
  width: 2, // stroke thickness
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
  shift: 12
};

/*work*/
export const WORK = {
  top: 200, // distance from its page-top
  marginX: 465,
  ruleGap: 0,
  maxW: 620, // right column paragraph width
  rowH: 50, // vertical spacing between job names
  barW: 2, // cyan bar thickness
  barH: 50, // cyan bar height
  padX: 16, // gap between bar and job label
  hitShift: 10,
  buttonSize: 200,
  labelW: 200,
  labelPadX: 14, // horizontal padding inside the swatch
  labelPadY: 6,        // vertical padding
  hlPad: 0,
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
  shift: 22, // px the bar slides when switching
  barEase: 0.14
};

export const NAV_ANIM = {
  speed: 0.03, // global timer advance per frame  (0-1)
  stagger: 0.35, // delay between successive items
  dropPx:  30 // start-offset above baseline
};

/* Projects */
export const BUILDS = { /* section header */
  top: 200, // distance from page-top
  marginX: 310, // global left margin
  ruleGap: -10, // grey rule alignment
  cornerR: 6, // card corner radius
  ghSize: 28, // GitHub icon size
};

let startX1 = 490;
let startY1 = 330;

let startX2 = -510;
let startY2 = 330;

let startX3 = 490;
let startY3 = 330;

let startX4 = -510;
let startY4 = 330;

export const BUILD_CURVES = [
  /* each curve starts well off-screen and ends at (0,0) */
  [[startX1-480,startY1-320],[startX1-320,startY1-420],[startX1-140,startY1-90],[startX1,startY1]],   // project 0
  [[ startX2+480,startY2-320],[ startX2+320,startY2-420],[ startX2+140,startY2-90],[startX2,startY2]],   // project 1
  [[startX3-480,startY3-320],[startX3-320,startY3-420],[startX3-140,startY3-90],[startX3,startY3]],   // project 2
  [[ startX4+480,startY4-320],[ startX4+320,startY4-420],[ startX4+140,startY4-90],[startX4,startY4]],   // project 3
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

    imgPos: { x:   0,  y:   0,  w: 580, h: 320 },
    card: { x: 520,  y:  90, w: 500, h: 120 },
    ghPos: { x: 990,  y:  250 }
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
    imgPos: { x: 420, y: 500,  w: 580, h: 320 }, // picture on the right
    card: { x: 0,   y: 580, w: 500, h: 120 }, // text on the left
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
    imgPos: { x: 300,  y:   1000,  w: 150, h: 320 },
    card: { x: 520,  y:  1080, w: 500, h: 120 },
    ghPos: { x: 990,  y:  250 }
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
    imgPos: { x: 420, y: 1500,  w: 580, h: 320 }, // picture on the right
    card: { x: 0,   y: 1580, w: 500, h: 120 }, // text on the left
  },
];

/*Other Projects*/
export const NOTEWORTHY = {
  top: 130, // distance from page-top of *this* section
  marginX: 430, // global left margin (looks centred under header)
  gap: 40, // px between cards (both x & y)
  cardW: 375,
  cardH: 235,
  cornerR: 6,
  liftPx: 10, // how far a card rises on hover
  speed: 0.08, // logistic input advance per frame
  ghSize: 24,
  iconGap: 18 // distance folder→GH→external
};

export const NOTE_LIST = [
  {
    title: 'Paper on Quantum Random Walks',
    desc: 'Report analyzing the behavior and novel use cases of random walks using quantum computers',
    tech: ['Quantum Computing'],
    url: 'assets/PDF/Paper on Quantum Random Walks.pdf'
  },
  {
    title: 'Paper on Information Cascades',
    desc: 'In depth analysis on the way information propagates through wikipedia articles',
    tech: ['Python', 'Beautiful Soup', 'Data Mining'],
    url: 'assets/PDF/Paper on Information Cascades.pdf'
  },
  {
    title: 'Presentation on the History of English',
    desc: 'Presented to the Boston University history club',
    tech: ['Flutter', 'Firebase', 'Firestore'],
    url: 'assets/PDF/History of English.pdf'
  },
  {
    title: 'Schubert\'s Piano Trio No. 1 in B-Flat',
    desc: 'I played the cello part!',
    tech: ['Cello'],
    url: 'https://youtu.be/uOSbVwMUbJo'
  }
];

export const GLOBE_BOX = {
  top: 400, // distance from top of its page
  left: 300, // left margin
  size: 500, // outer square (px)
  COORDINATE: [],
};

export const INFO_PANEL = {
  left: 1050, // distance from the left edge of the canvas / page
  top: 2830 + 860 + 860 + 860 + 150, // distance from the top
  w: 320, // max width
};