/* GlobeCanvas.js */

import {
  COLORS,
  GLOBE_BOX,
  strokeRoundRect,
  convert,
  convertInt, getScale
} from '../utils.js';


import {PLACES} from '../places.js';
//let COAST_LINES = [];
import { loadCoast, COAST_LINES } from './introStage.js';
// /* coast-line cache  */
// let COAST_PROMISE;
// let COAST_LINES = [];
//
// function loadCoast () {
//   if (COAST_PROMISE) return COAST_PROMISE;
//   COAST_PROMISE = fetch('./src/assets/Maps/ne_50m_coastline.json')
//     .then(res => res.json())
//     .then(({ features }) => {
//       features.forEach(({ geometry }) => {
//         if (geometry.type === 'LineString') {
//           COAST_LINES.push(geometry.coordinates);
//         } else if (geometry.type === 'MultiLineString') {
//           geometry.coordinates.forEach(line => COAST_LINES.push(line));
//         }
//       });
//     });
//   return COAST_PROMISE;
// }

const toVec = (lat, lng) => {
  const phi = lat * Math.PI / 180;
  const lambda = -lng * Math.PI / 180; // west = positive X on screen
  const cosPhi = Math.cos(phi);
  return [cosPhi * Math.cos(lambda), Math.sin(phi), cosPhi * Math.sin(lambda)];
};

const proj = ([x, y, z], R) => [R * x, -R * y, z]; // flip Y for canvas

/* ================================================================== */
export default class GlobeCanvas {

  addMarker = (obj) => this.markers.push(obj);

  constructor (ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;

    /* run-time state */
    this.rotX = 0;
    this.rotY = 0;
    this.scale = 1;
    this.markers = [...PLACES];

    loadCoast();

    /*tiny DOM tooltip*/
    const tip = document.createElement('div');
    tip.style.cssText =
      'position:fixed;padding:4px 6px;font:12px/1 "SF Mono",monospace;' +
      'background:#111;border:1px solid #ffeb3b;color:#ffeb3b;' +
      'border-radius:3px;pointer-events:none;opacity:0;transition:opacity .15s;z-index:31';
    document.body.appendChild(tip);
    this.tooltip = tip;



    /* pointer interaction*/
    const hitTest = (clientX, clientY) => {
      const { left, top } = canvas.getBoundingClientRect();
      const x = clientX - left;
      const y = clientY - top;

      const cssH = canvas.height / (window.devicePixelRatio || 1);
      const PAGE_OFFSET = 6.85 * getScale() * cssH;
      const boxY = PAGE_OFFSET - window.scrollY + GLOBE_BOX.top;

      return (
        x >= GLOBE_BOX.left &&
        x <= GLOBE_BOX.left + GLOBE_BOX.size &&
        y >= boxY &&
        y <= boxY + GLOBE_BOX.size
      );
    };

    /* tracking vars shared with draw() */
    this.pointerX = 0;
    this.pointerY = 0;
    this.pointerInside = false;
    this.hovered = null;

    /*  drag to rotate */
    let dragging = false, lastX = 0, lastY = 0;
    canvas.addEventListener('pointerdown', e => {
      if (!hitTest(e.clientX, e.clientY)) return;
      dragging = true;
      lastX = e.clientX; lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener('pointermove', e => {
      this.pointerX = e.clientX;
      this.pointerY = e.clientY;
      this.pointerInside = hitTest(e.clientX, e.clientY);

      if (!dragging) return;

      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;  lastY = e.clientY;

      const BASE_SPEED = 0.005;
      const S = BASE_SPEED / this.scale;
      this.rotY += dx * S;
      this.rotX += dy * S;
    });

    canvas.addEventListener('pointerup', () => dragging = false);
    canvas.addEventListener('pointercancel', () => dragging = false);

    /* wheel to zoom */
    const ZOOM_STEP = 1.15;
    const MIN_SCALE = 0.1;
    const MAX_SCALE = 300;

    canvas.addEventListener('wheel', e => {
      if (!hitTest(e.clientX, e.clientY)) return;
      e.preventDefault();
      const dir = e.deltaY < 0 ? 1 : -1;
      this.scale *= dir > 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      this.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, this.scale));
    }, { passive: false });

    /* click to emit event */
    canvas.addEventListener('click', () => {
      if (this.hovered) {
        canvas.dispatchEvent(
          new CustomEvent('place-select', { detail: this.hovered })
        );
      }
    });
  }

  draw (scrollY) {

    // helper
    const paintDot = (p, hovered=false) => {
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, hovered ? convert(4) : convert(4), 0, Math.PI * 2);
      ctx.fillStyle = hovered ? '#ffeb3b' : '#ff4444';
      ctx.fill();
    };

    const { ctx, canvas } = this;
    const dpr = window.devicePixelRatio || 1;
    const cssH = canvas.height / dpr;
    const PAGE_OFFSET = 6.85 * cssH * getScale();
    if (scrollY < PAGE_OFFSET - cssH || scrollY > PAGE_OFFSET + cssH) return;
    const pageY = PAGE_OFFSET - scrollY;
    const hdrX = GLOBE_BOX.left; // line-up with left edge of globe
    const HDR_GAP = convert(-90); // vertical gap *above* the frame (px)
    const hdrY = pageY + GLOBE_BOX.top + HDR_GAP;
    // 04. cyan index number
    ctx.fillStyle = COLORS.cyan;
    ctx.font = convertInt(24) + 'px "SF Mono Regular", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('04.', hdrX, hdrY + convert(8));
    const idxW = ctx.measureText('04.').width + convert(8);
    // heading label
    ctx.fillStyle = COLORS.light;
    ctx.font = 'bold ' + convertInt(36) + 'px "Calibre", sans-serif';
    ctx.fillText('Travel', hdrX + idxW, hdrY);
    // grey horizontal rule
    ctx.strokeStyle = COLORS.gray + '66';
    ctx.lineWidth = convert(0.5);
    ctx.beginPath();
    ctx.moveTo(hdrX + idxW + convert(105), hdrY + convert(17));
    ctx.lineTo(hdrX + idxW + convert(105 + 300), hdrY + convert(17));
    ctx.stroke();

    ctx.fillStyle = COLORS.gray;
    ctx.font = convertInt(20) + 'px "Calibre", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText("I've traveled a lot — click around below to see where I've been!", hdrX, hdrY + convert(48));

    const box = GLOBE_BOX;
    const cx = box.left + box.size / 2;
    const cy = (PAGE_OFFSET - scrollY + box.top) + box.size / 2;
    const R = (box.size / 2 - convert(10)) * this.scale;

    ctx.save();
    ctx.translate(cx, cy);

    /* outline frame */
    ctx.lineWidth = convert(2);
    ctx.strokeStyle = COLORS.cyan;
    strokeRoundRect(ctx, -box.size/2, -box.size/2, box.size, box.size, convert(4));

    /* clipping so nothing bleeds out */
    ctx.beginPath();
    ctx.roundRect?.(-box.size/2, -box.size/2, box.size, box.size, convert(4));
    ctx.clip();

    /* rotation matrix */
    const sinX = Math.sin(this.rotX), cosX = Math.cos(this.rotX);
    const sinY = Math.sin(this.rotY), cosY = Math.cos(this.rotY);

    const rot = ([x, y, z]) => {
      let nx =  cosY * x + sinY * z;
      let nz = -sinY * x + cosY * z;
      let ny =  cosX * y - sinX * nz;
      nz =  sinX * y + cosX * nz;
      return [nx, ny, nz];
    };

    /* outer rim of the globe */
    ctx.lineWidth = convert(2); // match the square’s thickness
    ctx.strokeStyle = COLORS.cyan;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.stroke();

    /* coastlines */
    COAST_LINES.forEach(line => {
      let first = true;
      line.forEach(([lng, lat]) => {
        const v = rot(toVec(lat, lng));
        if (v[2] < 0) { first = true; return; }
        const [sx, sy] = proj(v, R);
        if (first) { ctx.moveTo(sx, sy); first = false; }
        else { ctx.lineTo(sx, sy); }
      });
    });
    ctx.stroke();

    const projected = [];
    this.markers.forEach(p => {
      const v = rot(toVec(p.lat, p.lng));
      if (v[2] < 0) return;
      const [sx, sy] = proj(v, R);
      projected.push({ ...p, sx, sy });
    });

    /* determine hovered place */
    if (this.pointerInside) {
      const THRESH = 6 * dpr;
      this.hovered = null;
      for (const p of projected) {
        const dx = this.pointerX - (cx + p.sx);
        const dy = this.pointerY - (cy + p.sy);
        if (dx*dx + dy*dy < THRESH*THRESH) { this.hovered = p; break; }
      }
    } else {
      this.hovered = null;
    }

    /* draw markers */
    projected.forEach(p => {
      if (!this.hovered || p.name !== this.hovered.name) paintDot(p);
    });
    // hovered one goes on top
    if (this.hovered) paintDot(this.hovered, true);

    /* tooltip visibility */
    if (this.hovered) {
      this.tooltip.textContent = this.hovered.name;
      this.tooltip.style.left = `${this.pointerX + convertInt(12)}px`;
      this.tooltip.style.top = `${this.pointerY + convertInt(12)}px`;
      this.tooltip.style.opacity = 1;
    } else {
      this.tooltip.style.opacity = 0;
    }
    ctx.restore();
  }
}
