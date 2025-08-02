import IntroStage from './components/introStage.js';
import HomeStage  from './components/homeStage.js';




const canvas = document.getElementById('hexCanvas');
const ctx    = canvas.getContext('2d');

resize(); window.addEventListener('resize', resize);

let currentStage;

function startIntro () {
    currentStage = new IntroStage(canvas, startHome);   // when intro ends → home
}
function startHome () {
    currentStage = new HomeStage(canvas, startIntro);   // pass restart callback
}

function resize() {
  const dpr   = window.devicePixelRatio || 1;
  canvas.width  = innerWidth  * dpr;
  canvas.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
}

startIntro();