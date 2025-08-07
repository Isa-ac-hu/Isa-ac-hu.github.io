/* infoPanel.js */
import { INFO_PANEL, convert, convertInt, getScale } from '../utils.js';

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
      zIndex : 30,
    });
    Object.assign(this.img.style, { width: '100%', borderRadius: convertInt(6) + 'px' });
    Object.assign(this.titleEl.style, { margin: 0, fontSize: convertInt(20) + 'px', color: '#ffeb3b' });
    Object.assign(this.descEl.style,{ margin: 0, lineHeight: convert(1.4) });

    this.el.append(this.titleEl, this.descEl, this.img);
    document.body.appendChild(this.el);

    this.ctx = ctx;
    this.canvas = canvas;

    const dpr = window.devicePixelRatio || 1;
    const cssH = canvas.height / dpr;
     this.pageOffset = 6 * cssH * getScale();
  }



  updatePosition = () => {
    const pageOffset = this.pageOffset;
    const gap = convert(150);
    const topPx = pageOffset + GLOBE_BOX.top + GLOBE_BOX.size + gap;
    this.el.style.position = 'absolute';
    this.el.style.top = `${topPx}px`;

  }

  /* lazy-load image on demand */
  show ({ name, desc, img }) {
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
}
