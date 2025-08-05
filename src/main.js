import IntroStage from './components/introStage.js';
import HomeStage  from './components/homeStage.js';
import {easeLogistic, ensureHeaderGlass, hideHeader, showHeader } from './utils.js';
import Header from './components/header.js';


const canvas = document.getElementById('hexCanvas');
const ctx    = canvas.getContext('2d');


let headerCanvas, headerCtx, headerRAF, header;
function resizeMain() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeMain();
window.addEventListener('resize', resizeMain);

let currentStage;            // (unchanged)


function startIntro () {
    hideHeader();
    currentStage = new IntroStage(canvas, startHome);   // when intro ends → home
}


function startHome() {
    // currentStage = new HomeStage(canvas, startIntro, header);

    if (!headerCanvas) {
        // 1 — blurred glass strip
        ensureHeaderGlass();

        // 2 — fixed header canvas
        headerCanvas            = document.createElement('canvas');
        headerCanvas.id         = 'headerCanvas';
        Object.assign(headerCanvas.style, {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '72px',
            pointerEvents: 'none',
            zIndex: 20,
            background: 'transparent'
        });
        document.body.appendChild(headerCanvas);

        headerCtx = headerCanvas.getContext('2d');

        /* resize helper */
        function resizeHeader () {
            const dpr = window.devicePixelRatio || 1;
            headerCanvas.width  = innerWidth * dpr;
            headerCanvas.height = 72         * dpr;
            headerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        resizeHeader();
        window.addEventListener('resize', resizeHeader);

        /* shared Header instance */
        header = new Header(headerCtx, headerCanvas);

        /* draw loop for the header canvas */
        const loop = () => {
            headerCtx.clearRect(0, 0, headerCanvas.width, headerCanvas.height);
            header.draw();                         // autonomous animation
            headerRAF = requestAnimationFrame(loop);
        };
        showHeader();
        loop();
    } else {
        header.resetFade();                      // logo + nav drop-in again
        showHeader();
    }

    /* ---------- now the HomeStage ---------- */
    currentStage = new HomeStage(canvas, startIntro, header);

}



startIntro();