/* infoPanel.js */
import { INFO_PANEL, GLOBE_BOX, convert, convertInt, getScale } from '../utils.js';

export default class InfoPanel {
  constructor (ctx, canvas) {
    /* build DOM only once */
    this.el = document.createElement('div');
    this.img = document.createElement('img');
    this.titleEl = document.createElement('h3');
    this.descEl = document.createElement('p');
    /* styling */
    Object.assign(this.el.style, {
      position : 'absolute',
      left : `${INFO_PANEL.left}px`,
      top : `${INFO_PANEL.top}px`,
      maxWidth : `${INFO_PANEL.w}px`,
      display : 'none',
      flexDirection : 'column',
      gap : convertInt(12) + 'px',
      color : '#ccd6f6',
      fontFamily : '"Inter",sans-serif',
      zIndex : 2,
    });
    Object.assign(this.img.style, { width: '100%', borderRadius: convertInt(6) + 'px' });
    Object.assign(this.titleEl.style, { margin: 0, fontSize: convertInt(20) + 'px', color: '#ffeb3b' });
    Object.assign(this.descEl.style,{ margin: 0, lineHeight: convert(1.4) });

    this.el.append(this.titleEl, this.descEl, this.img);
    document.body.appendChild(this.el);

    this.ctx = ctx;
    this.canvas = canvas;
    this.pageOffset = 0;
    this.onResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const cssH = this.canvas.height / dpr;
      this.pageOffset = 6.85 * cssH;
      this.updatePosition();
    };
    window.addEventListener('resize', this.onResize, { passive: true });
    // initial position
    this.onResize();
  }



  updatePosition = () => {
    const topPx = this.pageOffset + GLOBE_BOX.top;
    this.el.style.top = `${topPx}px`;
  }

  /* lazy-load image on demand */
  show ({ name, desc, img }) {
    this.updatePosition();
    this.titleEl.textContent = name;
    this.descEl.textContent = desc;

    /* lazy image load */
    if (this.img.getAttribute('data-loaded') !== img) {
      this.img.src = '';
      const pic = new Image();
      pic.onload = () => {
        this.img.src = pic.src;
        this.img.setAttribute('data-loaded', img);
      };
      pic.src = `./src/assets/images/${img}`;
    }
    this.el.style.display = 'flex';
  }
  hide () { this.el.style.display = 'none'; }

  destroy () {
    this.hide();
    window.removeEventListener('resize', this.onResize);
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
  }
}
