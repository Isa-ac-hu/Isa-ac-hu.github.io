/* utils.js – shared helpers & constants */


/*#############################FUNCTIONS GO HERE###################################*/

export function resizeHiDPI(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1;
  const { width: cssW, height: cssH } = canvas.getBoundingClientRect();

  // only resize if something changed (avoids useless re-allocations)
  if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
    canvas.width  = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);         // draw in CSS-px from now on
  }
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

//####################################CONSTANTS GO HERE########################################
export const COLORS = {
  cyan   : 'rgba(100,255,218,1)',        // bright mint
  bgDark : '#0A192F',
  bgDeep : '#020C1B',
  light  : 'rgba(204,214,246,1)',   // name + headline lines
  gray   : 'rgba(136,146,176,1)',   // paragraph + nav labels
  gray15 : 'rgba(136,146,176,.15)',   // translucent for hit‑boxes / line
};

/* central place for design constants */

export const LOGO = {
    anchor: { x: 70, y: 50 },   // where the mini‑logo is drawn
    size   : { w: 45,  h: 45 },                 // click zone width/height in CSS‑px
    scale : 0.022,              // radius factor (r = min(vw,vh)*scale)
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

export const RESUME_URL =
  'assets/resumes/Isaac%20Hu%20Resume.pdf';   // adjust if you move the file

/* hero button geometry (CSS px in the design coordinate‑system) */
export const HERO_BTN = {
    x : 320,          // left‑edge (same margin as the “Hi, my name is”)
    y : 540,          // fine‑tune after you see it live
    w : 160,
    h : 56,
    label : 'Get In Touch',
    mail  : 'mailto:isaac.hu002@gmail.com',
    connectRadius: 6,
};

/* ───────────────── Hero intro animation ────────────────────────── */
export const HERO_ANIM = {
    delay     : 0.5,   // seconds AFTER the header completes
    stagger   : 0.35,  // delay between successive hero lines
    dropPx    : 30,    // start-offset below baseline
    speed     : 0.03   // timer advance per frame  (0-1)
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
            url     : 'https://github.com/Isa-ac-hu'
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
  ruleGap : 17,          // vertical align of the grey rule
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



export const BAR_ANIM = {
  delay  : 0.5,   // seconds after hero completes
  speed  : 0.03,  // logistic input advance per frame
};

/*  small portrait-hover animation  */
export const PORTRAIT_ANIM = {
  speed : 0.08,    // higher = snappier ease
  shift : 12       // px the outline moves up-left at 100 %
};




/* ─── 3 rd page: Work / Experience ──────────────────────────────── */
export const WORK = {
  top       : 200,          // distance from its page-top
  marginX   : 465,          // same lateral margin as About
  ruleGap   : 17,
  maxW      : 620,          // right column paragraph width
  rowH      : 50,           // vertical spacing between job names
  barW      : 2,            // cyan bar thickness
  barH      : 50,           // cyan bar height
  padX      : 16,           // gap between bar and job label

  hitShift  : 10,

  buttonSize: 200,

  labelW : 200,

  labelPadX : 14,       // horizontal padding inside the swatch
  labelPadY : 6,        // vertical padding
  hlPad     : 0,
};

/* tiny data-model – extend/replace as you like */
export const JOBS = [
  {
    company : 'Church & Dwight',
    title   : 'IT Analyst Intern',
    date    : 'May 2024 – Dec 2024',
    website : 'https://churchdwight.com',
    bullets : [
      'Built end-to-end automation pipeline for purchase-order processing with Power Automate and Python, routing hundreds of special-format PDF contracts',
      'Used K-means clustering in R to uncover consumer insights and desires from a laundry product survey, utilizing CRISP-DM methodology to help support data driven business decisions',
      'Authored Selenium automation test suites for 20 ServiceNow forms, checking for unintended behaviors',
    ]
  },
  {
    company : 'Carpenter Technology',
    title   : 'Digital Technology Intern',
    date    : 'May 2023 – Aug 2023',
    website : 'https://www.carpentertechnology.com',
    bullets : [
      'Analyzed iron-production process data in Python; applied receiver operating characteristic analysis to find factors associated with coarse grain steel, using base model of random forest',
      'Mined SAP plant-maintenance data with Pandas and Power BI, building algorithms to better inform spot-buys and reduce aging of inventory in warehouse'
    ]
  },


  {
    company : 'Boston University',
    title   : 'Course Staff',
    date    : 'Jan 2023 – May 2025',
    website : 'https://www.bu.edu',
    /* each role is an object with its own sub-bullets */
    bullets : [
      {
        role : 'Teaching Assistant — CS210 Computer Systems (Sept 2024 – May 2025)',
        desc : [
          'Instruct two-hour weekly labs for 250 students on digital logic design, C, x86-64 assembly, cache hierarchies',
          'Built containerised autograder (Python + pytest) that compiles binaries, runs differential checks, and posts results to Gradescope;',
        ]
      },
      {
        role : 'Course Assistant — CS237 Fundamentals of Statistics (Jan 2023 - May 2024)',
        desc : [
          'Collaborate with staff on course material and assessment design',
          'Co-teach discussions, hold office hours, grade, and proctor exams'
        ]
      },
      {
        role : 'Computer-Science Grader — CS330 Algorithm Analysis (Jan 2023 - May 2023)',
        desc : [
          'Grade proofs and algorithm-design assignments; give written feedback'
        ]
      },
    ]
  },
  {
    company : 'Gravic Inc',
    title   : 'Programming Intern',
    date    : 'May 2022 – Jul 2022',
    website : 'https://www.gravic.com',
    bullets : [
      'Worked in Power BI to create interactive visuals and models for sales database to be used by the sales team, utilizing DAX scripting to format and derive values from collected data',
      'Wrote visual basic software and bash scripts for parsing and modifying Optical Mark Recognition forms to test company scanners'
    ]
  }
];



/* animation for the selector bar */
export const WORK_ANIM = {
  speed  : 0.08,    // logistic input speed
  shift  : 22,      // px the bar slides when switching
  barEase: 0.14     // 0‒1 lerp factor for the cyan bar
};

export const GLOBE_BOX = {
  top  : 250,          // distance from top of its page
  left : 300,          // left margin
  size : 500,          // outer square (px)

  COORDINATE : [],
};



export const INFO_PANEL = {
  left : 1050,   // distance from the left edge of the canvas / page
  top  : 2830 + 860 + 860 + 860,   // distance from the top
  w    : 320,   // max width  (img will auto-scale to this)
};

export const NAV_ANIM = {
  speed   : 0.03,   // global timer advance per frame  (0-1)
  stagger : 0.35,   // delay between successive items  (seconds of timer)
  dropPx  :  30     // start-offset above baseline     (px)
};


/* ─── 4 th  page: Projects / Builds ─────────────────────────────── */
export const BUILDS = { /* section header */
  top      : 200,          // distance from page-top
  marginX  : 310,          // global left margin
  ruleGap  : 0,           // grey rule alignment
  cornerR  : 6,            // card corner radius
  ghSize   : 28,           // GitHub icon size
};

/* tiny data-model – one object per project                          */
export const PROJECT_LIST = [
  {
    title   : 'Ball Balancing PID Embedded System',
    tagline : 'Featured Project',
    blurb   :
      'Closed loop PID controller programmed in C on a Microchip dsPIC33 that can balance a ball on the center of a platform, filtering noisy signals using a 2nd order Butterworth filter.',
    tech    : ['dsPIC33', 'C', 'PID', 'UART'],
    img     : 'AmazingBallSystem.jpg',           // lives in assets/images
    repo    : 'https://github.com/Isa-ac-hu',    // opens in new tab

    align   : 'right',

    imgPos : { x:   0,  y:   0,  w: 580, h: 320 },
    card   : { x: 520,  y:  90, w: 500, h: 120 },
    ghPos  : { x: 990,  y:  250 } // optional; omit → auto bottom-right
  }, // …push more objects here for more cards

  {
    title   : 'Tetris Playing Autonomous Agent',
    tagline : 'Featured Project',
    blurb   : 'A script written in Java, using Q-learning with a heuristic emphasizing the minimization gaps between blocks and total height. It learned how to stay alive in Tetris indefinitely after training for 48 hours, in 2000 trials.',
    tech    : [ 'Java' ],
    img     : 'Tetris.gif',          // <- real .gif
    repo    : 'https://github.com/Isa-ac-hu/tetris',

    align   : 'left',

    frames : {
      dir   : 'Tetris/frame_',  // <assets/gifs/>dir + ## + ext
      ext   : '.png',           // file extension
      count : 65,               // how many numbered frames
      fps   : 10                // 100 ms per frame  (count * fps ~= 6 s loop)
    },


    imgPos  : { x: 420, y: 500,  w: 580, h: 320 }, // picture on the right
    card    : { x: 0,   y: 580, w: 500, h: 120 }, // text on the left
  },

  {
    title   : 'Flutter Scheduling App',
    tagline : 'Featured Project',
    blurb   :
      'App that gradually learns a persons\'s habits, and algorithmically deduces the amount of time they need to get ready to better plan their day. Integrated with google maps and calendar.',
    tech    : ['Flutter', 'Firebase', 'Google Calendar', 'Google Authentication'],
    img     : 'Timo.png',           // lives in assets/images
    repo    : 'https://github.com/Isa-ac-hu',    // opens in new tab

    align   : 'right',

    imgPos : { x: 300,  y:   1000,  w: 150, h: 320 },
    card   : { x: 520,  y:  1080, w: 500, h: 120 },
    ghPos  : { x: 990,  y:  250 } // optional; omit → auto bottom-right
  },

  {
    title   : 'Arduino Robot',
    tagline : 'Featured Project',
    blurb   : 'Robot powered by a small arduino computer, with activatable motors, infrared sensors, and speakers. Made to greet people.',
    tech    : [ 'Arduino', 'C', 'Circuit Design' ],
    img     : 'Arduino.gif',          // <- real .gif
    repo    : 'https://github.com/Isa-ac-hu/tetris',

    align   : 'left',

    frames : {
      dir   : 'Arduino/frame_',  // <assets/gifs/>dir + ## + ext
      ext   : '.png',           // file extension
      count : 65,               // how many numbered frames
      fps   : 10                // 100 ms per frame  (count * fps ~= 6 s loop)
    },


    imgPos  : { x: 420, y: 1500,  w: 580, h: 320 }, // picture on the right
    card    : { x: 0,   y: 1580, w: 500, h: 120 }, // text on the left
  },
];



/* ─── 5th page : Other Noteworthy Projects ───────────────────────── */
export const NOTEWORTHY = {
  top       : 220,          // distance from page-top of *this* section
  marginX   : 250,          // global left margin (looks centred under header)
  gap       : 40,           // px between cards (both x & y)
  cardW     : 350,
  cardH     : 220,
  cornerR   : 6,
  liftPx    : 10,           // how far a card rises on hover
  speed     : 0.08,         // logistic input advance per frame
  ghSize    : 24,
  iconGap   : 18            // distance folder→GH→external
};

/* four small-card entries (extend at will) */
export const NOTE_LIST = [
  {
    title : 'Slay The Spire',
    desc  : 'Implemented Slay the Spire: Card based battle game for desktop clone using Java and JavaFX technologies.',
    tech  : ['Java', 'JavaFX'],
    repo  : 'https://github.com/Isa-ac-hu/slay-the-spire'
  },
  {
    title : 'Yelp-Camp',
    desc  : 'Developed website Yelp Camp for exploring hand-picked campgrounds around the world.',
    tech  : ['ejs', 'express', 'mongoDB'],
    repo  : 'https://github.com/Isa-ac-hu/yelp-camp',
    ext   : 'https://yelp-camp-demo.netlify.app'   // optional  ↗ link
  },
  {
    title : 'Done.',
    desc  : 'Created a free to use cross-platform mobile todo list/reminder application using Flutter.',
    tech  : ['Flutter', 'Firebase', 'Firestore'],
    repo  : 'https://github.com/Isa-ac-hu/done'
  },
  {
    title : 'Ubeat',
    desc  : 'Developed a platform for mothers to record & share baby\'s heartbeat',
    tech  : ['Java', 'Android', 'Firebase'],
    repo  : 'https://github.com/Isa-ac-hu/ubeat'
  }
];