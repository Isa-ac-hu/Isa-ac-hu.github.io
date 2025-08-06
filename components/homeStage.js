//homeStage.js
import {
  polygonPoints,
  COLORS,
  LOGO,
  LOGO_BOUNDS,
  isLogoHit,
  HERO_BTN,
  RESUME_URL,
  BAR_ANIM,
  resizeHiDPI
} from '../utils.js';

import Header from './header.js';
import Hero from './hero.js';
import SocialBar from './socialBar.js';
import MailBar from './mailBar.js';
import AboutCanvas from './aboutSection.js';
import GlobeCanvas   from './globeCanvas.js';
import InfoPanel    from './infoPanel.js';
import WorkCanvas from './workCanvas.js';
import BuildCanvas  from './buildCanvas.js';
import NoteworthyCanvas from './noteworthyCanvas.js';

export default class HomeStage {
  constructor(canvas, restartCallback = () => {}, headerShared) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.restart = restartCallback;
    this.heroDoneTime = null;

    // Hi-DPI setup
    resizeHiDPI(canvas, this.ctx);
    this.onResize = () => resizeHiDPI(canvas, this.ctx);
    window.addEventListener('resize', this.onResize);

    /* logo animation state */
    this.logoProg  = 0;
    this.logoDone  = false;

    /* simple click handler */
    this.hero = new Hero(this.ctx, this.canvas);

    this.mailBar = new MailBar (this.ctx, this.canvas);
    this.about = new AboutCanvas(this.ctx,this.canvas)
    this.globe = new GlobeCanvas(this.ctx,this.canvas);
    this.work = new WorkCanvas(this.ctx,this.canvas);
    this.builds = new BuildCanvas(this.ctx,this.canvas);
    this.notes = new NoteworthyCanvas(this.ctx,this.canvas);
    this.socialBar = new SocialBar(this.ctx, this.canvas);
    this.header = headerShared;
    this.panel = new InfoPanel();

    document.body.style.height = `${7.4 * 100}vh`; // Hero (1vh) + About (1vh)
    this.scrollY  = 0;

    window.addEventListener('scroll', this.onScroll);
    this.canvas.addEventListener('place-select', this.onPlaceSelect);
    this.canvas.addEventListener('mousemove', this.onMove);

    this.frameId = requestAnimationFrame(this.frame);

    this.canvas.addEventListener('click', this.onClick);
    canvas.addEventListener('click', this.header.onClick);

  }

  onScroll = () => {
    this.scrollY = window.scrollY || window.pageYOffset;
  }

  onPlaceSelect = ({ detail }) => { this.panel.show(detail); };

  /* ---------- hover helper ---------- */
  onMove = (e) => {
    const rect = this.canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const lineGap = 64;
    const overLogo = this.logoDone && isLogoHit(cssX, cssY);
    const overSocial = this.socialBar.hoverAny;
    const btnTop = HERO_BTN.y - this.scrollY + lineGap;
    const btnBottom = btnTop + HERO_BTN.h;
    const overBtn =
      cssX >= HERO_BTN.x && cssX <= HERO_BTN.x + HERO_BTN.w &&
      cssY >= btnTop && cssY <= btnBottom;

    this.hero.setHover(overBtn);

    const overHeaderOrResume = this.header.updateHover(e.clientX, e.clientY);
    const overMail = this.mailBar.hover;

    const overAboutLink = this.about.linkHover;
    const overCompanyLink = this.work.linkHoverGlobal;
    const overNotes = this.notes.hoverAny;
    const overBuildGH = this.builds.hovers.some(v => v);
    this.canvas.style.cursor = (
      overLogo || overBtn || overHeaderOrResume || overMail || overSocial ||
      overAboutLink || overCompanyLink || overNotes || overBuildGH) ? 'pointer' : '';
  };

  onClick = (e) => {
    if (!this.logoDone) return; // wait until fade‑in finished
    const rect = this.canvas.getBoundingClientRect();
    const cssX   = e.clientX - rect.left;
    const cssY   = e.clientY - rect.top;
    /*  Resume button – handled entirely by Header’s geometry  */
    if (this.header.isResumeHit(e.clientX, e.clientY)) {
      window.open(RESUME_URL, '_blank');
      return;
    }
    /* device-pixel coords (existing math)  */
    const pxX = cssX * (this.canvas.width  / rect.width);
    const pxY = cssY * (this.canvas.height / rect.height);

    if (isLogoHit(e.clientX, e.clientY)) {
      this.destroy();
      this.restart();
    }

    const lineGap = 64;

    /* canvas-to-CSS scaling factor */
    const scale = this.canvas.width / rect.width;
    const btnLeft =  HERO_BTN.x * scale;
    const btnRight = (HERO_BTN.x + HERO_BTN.w) * scale;
    const btnTop = (HERO_BTN.y - this.scrollY + lineGap) * scale;
    const btnBottom =  btnTop + HERO_BTN.h * scale;
    if (pxX >= btnLeft && pxX <= btnRight &&
      pxY >= btnTop  && pxY <= btnBottom) {
      window.open(HERO_BTN.mail, '_self'); // launches default mail app
    }
  };

  destroy() {
    cancelAnimationFrame(this.frameId);
    this.canvas.removeEventListener('click', this.onClick);
    this.canvas.removeEventListener('mousemove', this.onMove);
    window.removeEventListener('scroll', this.onScroll);
    this.canvas.removeEventListener('place-select', this.onPlaceSelect);
    window.removeEventListener('resize', this.onResize);
  }

  /* main RAF */
  frame = (ts) => {
    this.scrollY = window.scrollY || window.pageYOffset;
    const { ctx, canvas } = this;
    resizeHiDPI(this.canvas, this.ctx);

    /* background & placeholder text */
    ctx.fillStyle = COLORS.bgDark;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const headerDone =
      this.header.logoProg >= 1 && this.header.navProg >= this.header.navDone;
    this.socialBar.draw(this.socialBar);
    this.mailBar.draw();
    this.about.draw(this.scrollY);
    this.globe.draw(this.scrollY);
    this.work.draw(this.scrollY);
    this.builds.draw(this.scrollY);
    this.notes.draw(this.scrollY);

    if (!this.logoDone) {
      this.logoProg += 0.03;
      if (this.logoProg >= 1) { this.logoProg = 1; this.logoDone = true; }
    }

    this.hero.draw(this.scrollY, headerDone);
    if (headerDone && this.hero.isFinished() && this.heroDoneTime === null) {
      this.heroDoneTime = performance.now();
    }

    if (this.heroDoneTime &&
      performance.now() - this.heroDoneTime > BAR_ANIM.delay * 1000) {
      this.mailBar.visible   = true;
      this.socialBar.visible = true;
    }

    this.socialBar.draw();
    this.mailBar.draw();
    this.frameId = requestAnimationFrame(this.frame);
  };
}
