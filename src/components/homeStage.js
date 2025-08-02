import { polygonPoints, COLORS, LOGO, LOGO_BOUNDS, isLogoHit, HERO_BTN } from '../utils.js';      // keeps util helper
import Header from './header.js';
import Hero from './hero.js';
import SocialBar from './socialBar.js';
import MailBar from './mailBar.js';
import AboutCanvas from './aboutSection.js';
import GlobeCanvas   from './globeCanvas.js';
import InfoPanel    from './infoPanel.js';

export default class HomeStage {
    constructor(canvas, restartCallback = () => {}) {
        this.canvas  = canvas;
        this.ctx     = canvas.getContext('2d');
        this.restart = restartCallback;



        /* logo animation state */
        this.logoProg  = 0;   // 0‑1 fade in
        this.logoDone  = false;

        /* simple click handler */





        this.hero   = new Hero(this.ctx, this.canvas);

        this.mailBar   = new MailBar (this.ctx, this.canvas);
        this.about = new AboutCanvas(this.ctx,this.canvas)
        this.globe  = new GlobeCanvas(this.ctx,this.canvas);
        this.socialBar = new SocialBar(this.ctx, this.canvas);
        this.header = new Header(this.ctx, this.canvas);
        this.panel   = new InfoPanel();

        document.body.style.height = `${3 * 100}vh`;   // Hero (1vh) + About (1vh)

        this.scrollY  = 0;                  // new
        window.addEventListener('scroll', this.onScroll);
        this.canvas.addEventListener('place-select', this.onPlaceSelect);


        this.canvas.addEventListener('mousemove', this.onMove);



        this.frameId = requestAnimationFrame(this.frame);

      this.canvas.addEventListener('click', this.onClick);

    }
    onScroll = () => {             // store CSS‑px scroll offset
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
      const btnTop  = HERO_BTN.y - this.scrollY + lineGap;
      const btnBottom = btnTop + HERO_BTN.h;
      const overBtn =
        cssX >= HERO_BTN.x && cssX <= HERO_BTN.x + HERO_BTN.w &&
        cssY >= btnTop     && cssY <= btnBottom;

      const overHeader = this.header.updateHover(cssX, cssY);
      const overMail   = this.mailBar.hover;          // set in its own onMove


      this.canvas.style.cursor = (overLogo || overBtn || overHeader || overMail || overSocial) ? 'pointer' : '';


    };


    onClick = (e) => {
        if (!this.logoDone) return;                  // wait until fade‑in finished

        const rect = this.canvas.getBoundingClientRect();
        const cssX = (e.clientX - rect.left) * (this.canvas.width  / rect.width);
        const cssY = (e.clientY - rect.top ) * (this.canvas.height / rect.height);

        /* logo is centered at (48,48); radius ≈ 64px box */
        if (isLogoHit(cssX, cssY)) {
            this.destroy();                 // stop drawing & remove listener
            this.restart();                 // create a brand‑new IntroStage
        }

        const lineGap = 64;                       // ← same number used in Hero.draw

      /* canvas-to-CSS scaling factor ( = devicePixelRatio ) */
      const scale = this.canvas.width / rect.width;
      const btnLeft   =  HERO_BTN.x               * scale;
      const btnRight  = (HERO_BTN.x + HERO_BTN.w) * scale;
      const btnTop    = (HERO_BTN.y - this.scrollY + lineGap) * scale;
      const btnBottom =  btnTop + HERO_BTN.h * scale;
      if (cssX >= btnLeft && cssX <= btnRight &&
        cssY >= btnTop  && cssY <= btnBottom) {
        window.open(HERO_BTN.mail, '_self');     // launches default mail app
      }
    };
    destroy() {
        cancelAnimationFrame(this.frameId);
        this.canvas.removeEventListener('click', this.onClick);
        this.canvas.removeEventListener('mousemove', this.onMove);
        window.removeEventListener('scroll', this.onScroll);
        this.canvas.removeEventListener('place-select', this.onPlaceSelect);
    }

    /* called on window resize */
    reset() {
        /* nothing needed yet – logo scales with vw/vh */
    }

    /* main RAF */
    frame = (ts) => {
        this.scrollY = window.scrollY || window.pageYOffset;
        const { ctx, canvas } = this;

        /* --- background & placeholder text --- */
        ctx.fillStyle = COLORS.bgDark;
        ctx.fillRect(0, 0, canvas.width, canvas.height);



        this.header.draw(this.logoProg);
        this.hero.draw(this.scrollY);
        this.socialBar.draw(this.socialBar);
        this.mailBar.draw();
        this.about.draw(this.scrollY);
        this.globe.draw(this.scrollY);

        if (!this.logoDone) {
            this.logoProg += 0.03;
            if (this.logoProg >= 1) { this.logoProg = 1; this.logoDone = true; }
        }



        /* loop forever */
        this.frameId = requestAnimationFrame(this.frame);
    };
}
