/* infoPanel.js – lightweight DOM component
   ======================================= */

import { INFO_PANEL } from '../utils.js';

export default class InfoPanel {
  constructor () {
    /* build DOM only once */
    this.el       = document.createElement('div');
    this.img      = document.createElement('img');
    this.titleEl  = document.createElement('h3');
    this.descEl   = document.createElement('p');

    /* styling */
    Object.assign(this.el.style, {
      position      : 'absolute',
      left          : `${INFO_PANEL.left}px`,
      top           : `${INFO_PANEL.top}px`,
      maxWidth      : `${INFO_PANEL.w}px`,
      display       : 'none',
      flexDirection : 'column',
      gap           : '12px',
      color         : '#ccd6f6',
      fontFamily    : '"Inter",sans-serif',
    });
    Object.assign(this.img.style,   { width: '100%', borderRadius: '6px' });
    Object.assign(this.titleEl.style, { margin: 0, fontSize: '20px', color: '#ffeb3b' });
    Object.assign(this.descEl.style,  { margin: 0, lineHeight: '1.4' });

    this.el.append(this.titleEl, this.descEl, this.img);
    document.body.appendChild(this.el);
  }

  /* populate & show – lazy-load image on demand */
  show ({ name, desc, img }) {
    this.titleEl.textContent = name;
    this.descEl.textContent  = desc;

    /* lazy image load */
    if (this.img.getAttribute('data-loaded') !== img) {
      this.img.src = '';                       // clear previous (prevents flash)
      const pic = new Image();
      pic.onload = () => {
        this.img.src = pic.src;
        this.img.setAttribute('data-loaded', img);
      };
      pic.src = `assets/images/${img}`;        // relative to /public or your bundler
    }

    this.el.style.display = 'flex';
  }

  hide () { this.el.style.display = 'none'; }
}
