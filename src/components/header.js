// src/components/header.js
import {COLORS, LOGO, HEADER, polygonPoints, strokeRoundRect, easeLogistic, lerpHex, NAV_ANIM } from '../utils.js';


export default class Header {
    constructor(ctx, canvas) {

        this.ctx    = ctx;
        this.canvas = canvas;
        this.hover  = -1;          // index of the link currently hovered
        this.hoverResume = false; // ← separate flag for the button

        this.resumeProg  = 0;

        this.SPEED       = 0.08;
        /* right‑hand nav data */
        this.links = [
            { num: '01.', label: 'About'      },
            { num: '02.', label: 'Experience' },
            { num: '03.', label: 'Work'       },
            { num: '04.', label: 'Contact'    },
        ];

        this.linkProg    = this.links.map(() => 0);

        /* fade-in of the mini-logo */
        this.logoProg   = 0;       // 0 → 1
        this.FADE_SPEED = 0.05;    // tweak to taste

        this.FADE_SPEED = 0.05;
        /* ---------- nav drop-in ---------- */
        this.navProg = 0;                // 0 → navDone
        this.navDone = 1 + NAV_ANIM.stagger * (this.links.length - 1)
    }
    /** call whenever you want the logo to fade-in again                        */
    resetFade() {
        this.logoProg = 0;
        this.navProg  = 0; }

    /** true if (cssX, cssY) is inside the Resume rounded-rect (CSS-px) */
    isResumeHit(cssX, cssY) {
        const dpr  = window.devicePixelRatio || 1;
        const cssW = this.canvas.width / dpr;
        const yMid = LOGO.anchor.y;

        const rx = cssW
            - HEADER.rightShift
            - HEADER.resumeW / 2
            + HEADER.resumeDistance;

        const left   = rx - HEADER.resumeW / 2;
        const right  = rx + HEADER.resumeW / 2;
        const top    = yMid - HEADER.resumeH / 2;
        const bottom = yMid + HEADER.resumeH / 2;
        return cssX >= left && cssX <= right && cssY >= top && cssY <= bottom;
    }

    /* alpha lets HomeStage fade‑in the logo */
    draw() {
        if (this.canvas.style.display === 'none') return;
        const { ctx, canvas } = this;

        const dpr   = window.devicePixelRatio || 1;
        const cssW  = canvas.width  / dpr;   // ← real visual width in CSS px
        const cssH  = canvas.height / dpr;   // ← not used here but handy

        /* advance fade */
        if (this.logoProg < 1) this.logoProg =
            Math.min(1, this.logoProg + this.FADE_SPEED);
        const alpha = easeLogistic(this.logoProg);   // ↗ S-curve

        /* start / continue nav timer once logo is visible */
        if (this.logoProg >= 1 && this.navProg < this.navDone)
            this.navProg = Math.min(this.navDone, this.navProg + NAV_ANIM.speed);

        // /* kick the nav animation only after the logo is fully shown */
        // if (this.logoProg >= 1 && this.navProg < 1)
        //     this.navProg = Math.min(1, this.navProg + this.NAV_SPEED);



        ctx.save();
        ctx.translate(HEADER.offsetX, HEADER.offsetY);

        /* ─── mini‑logo (left) ─────────────────────────────── */
        ctx.save();
        ctx.translate(LOGO.anchor.x, LOGO.anchor.y);
        ctx.globalAlpha = alpha;


        const r = Math.min(window.innerWidth, window.innerHeight) * LOGO.scale;
        ctx.lineWidth   = 3;
        ctx.strokeStyle = COLORS.cyan;
        ctx.beginPath();
        polygonPoints(r).forEach(([x, y], i) =>
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
        );
        ctx.closePath(); ctx.stroke();

        ctx.fillStyle = COLORS.cyan;
        ctx.font      = 'bold 25px "SF Mono Regular", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('I', 0, 0);
        ctx.restore();

        /* ─── right‑hand nav links ─────────────────────────── */
        ctx.font        = HEADER.font;
        ctx.textBaseline = 'middle';
        ctx.textAlign   = 'left';

        const y          = LOGO.anchor.y;
        const innerPad   = HEADER.innerPad;
        const numToLabel = HEADER.numToLabel;

        /* 1)  measure each link’s real width ------------------------------- */
        const metrics = this.links.map(({ num, label }) => {
            const numW   = ctx.measureText(num   ).width;
            const labelW = ctx.measureText(label ).width;
            /* hit‑box width = left‑pad + num + gap + label + right‑pad */
            const totalW = innerPad + numW + numToLabel + labelW + innerPad;
            return { numW, labelW, totalW };
        });

        /* 2) total width of the whole group ------------------------------- */
        const contentW = metrics.reduce((sum, m) => sum + m.totalW, 0) + HEADER.gap * (this.links.length - 1);

        /* 3) starting x so that the group ends just before the Resume button -- */
        let x = cssW - HEADER.resumeW - contentW - HEADER.rightShift;

        /* 4) draw each item & advance x ----------------------------------- */
        this.links.forEach(({ num, label }, idx) => {
            const { numW, totalW } = metrics[idx];

            /* --- drop-in progression (delay per index) -------- */
            const tRaw   = this.navProg - idx * NAV_ANIM.stagger;         // may be <0
            const t      = Math.max(0, Math.min(1, tRaw));             // clamp
            const easeT  = easeLogistic(t);                            // 0→1
            const dropY  = -NAV_ANIM.dropPx * (1 - easeT);   // 25 px → 0 px
            ctx.globalAlpha = easeT;                     // fade-in α
            ctx.save();
            ctx.translate(0, dropY);                     // vertical shift

            /* progress update for this link */
            if (idx === this.hover)
                this.linkProg[idx] = Math.min(1, this.linkProg[idx] + this.SPEED);
            else
                this.linkProg[idx] = Math.max(0, this.linkProg[idx] - this.SPEED);


            const hoverT = easeLogistic(this.linkProg[idx]);            // 0-1 only while hovering
            const color  = lerpHex('#CCD6F6', '#64FFDA', hoverT);


            /* 3·draw number + label ----------------------------------------- */
            ctx.fillStyle = COLORS.cyan;                           // number – always teal
            ctx.fillText(num, x + innerPad, y);

            ctx.fillStyle = color;
            ctx.fillText(label, x + innerPad + numW + numToLabel, y)


            /* advance to next slot (box + gap) */
            x += totalW + HEADER.gap;

            ctx.restore();
        });

        /* ─── Resume button ───────────────────────────────── */
        const rx = cssW - HEADER.rightShift - HEADER.resumeW / 2 + HEADER.resumeDistance;
        const ry = y;



        /* fade calculation */
        if (this.hoverResume) this.resumeProg = Math.min(1, this.resumeProg + this.SPEED);
        else                  this.resumeProg = Math.max(0, this.resumeProg - this.SPEED);
        const rT    = easeLogistic(this.resumeProg);
        const alpha2 = 0.25 * rT;
        if (alpha2 > 0.005) {
            ctx.fillStyle = `rgba(100,255,218,${alpha2})`;
            ctx.fillRect(rx - HEADER.resumeW / 2,
                ry - HEADER.resumeH / 2,
                HEADER.resumeW, HEADER.resumeH);
        }


        ctx.lineWidth   = 1;
        ctx.strokeStyle = COLORS.cyan;
        strokeRoundRect(
          ctx,
          rx - HEADER.resumeW / 2,
          ry - HEADER.resumeH / 2,
          HEADER.resumeW,
          HEADER.resumeH,
          HEADER.resumeRadius
        );

        ctx.fillStyle = COLORS.cyan;
        ctx.textAlign = 'center';
        ctx.fillText('Resume', rx, ry);

        ctx.restore();
    }

  /**
   * Mouse‑move helper – store which link (if any) is under the cursor.
   * Returns true ↔ pointer is over a link, so HomeStage can switch the cursor.
   */
    updateHover(cssX, cssY) {
        const { canvas } = this;
        const dpr   = window.devicePixelRatio || 1;
        const cssW  = canvas.width  / dpr;   // ← real visual width in CSS px
        const cssH  = canvas.height / dpr;   // ← not used here but handy

        const ctx        = this.ctx;
        ctx.font         = HEADER.font;

        const yMid       = LOGO.anchor.y;
        const hitH       = HEADER.resumeH;              // same vertical height


        // running x position of the *start* of each link
        const metrics = this.links.map(({ num, label }) => {
            const numW   = ctx.measureText(num  ).width;
            const labelW = ctx.measureText(label).width;
            const totalW = HEADER.innerPad + numW + HEADER.numToLabel + labelW + HEADER.innerPad;
            return { totalW };
        });
        const contentW = metrics.reduce((s, m) => s + m.totalW, 0)
            + HEADER.gap * (this.links.length - 1);


        let x = cssW - HEADER.resumeW - contentW - HEADER.rightShift;

        /* reset hover each call */
        this.hover = -1;
        this.hoverResume  = this.isResumeHit(cssX, cssY);

        metrics.forEach((m, idx) => {
            const stripStart = x;           // skip left padding
            const stripEnd   = x + m.totalW;         // no right padding
            const by         = yMid - hitH / 2;

            if (cssX >= stripStart && cssX <= stripEnd &&
                cssY >= by         && cssY <= by + hitH) {
                this.hover = idx;
            }

            // advance to next slot: full padded box + gap
            x += m.totalW + HEADER.gap;
        });

        return this.hover !== -1 || this.hoverResume;
    }
}


