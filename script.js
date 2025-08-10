// script.js
// Play an alarm siren using WebAudio, then after 3s reveal it's a prank using speechSynthesis.
// This file intentionally makes the 'reveal' explicit to keep the prank safe — never use to truly scare or defraud.

const WARNING_TIME = 3000; // milliseconds

function createSiren(ctx) {
  const master = ctx.createGain();
  master.gain.value = 0.6;
  master.connect(ctx.destination);

  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const gain2 = ctx.createGain();

  osc.type = 'sine';
  osc2.type = 'sine';
  osc.frequency.value = 600;
  osc2.frequency.value = 660;

  gain.gain.value = 0.0;
  gain2.gain.value = 0.0;

  osc.connect(gain); gain.connect(master);
  osc2.connect(gain2); gain2.connect(master);

  osc.start();
  osc2.start();

  // create a repeating siren by ramping frequencies
  let on = true;
  const interval = setInterval(()=>{
    if(!on){
      gain.gain.cancelScheduledValues(0);
      gain2.gain.cancelScheduledValues(0);
      gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.05);
      gain2.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.05);
      on = true;
    } else {
      gain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.02);
      gain2.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.02);
      // sweep frequencies
      osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.25);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.5);
      osc2.frequency.linearRampToValueAtTime(460, ctx.currentTime + 0.25);
      osc2.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.5);
      on = false;
    }
  }, 500);

  return { stop: ()=>{ clearInterval(interval); osc.stop(); osc2.stop(); master.disconnect(); } };
}

function playCheer(ctx) {
  // small simulated cheering using short noise bursts (not realistic, just effect)
  const master = ctx.createGain(); master.gain.value = 0.6; master.connect(ctx.destination);
  const duration = 1200;
  const bufferSize = ctx.sampleRate * duration/1000;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for(let i=0;i<bufferSize;i++){
    // noise that decays -> short crowd-like bursts
    const t = i / ctx.sampleRate;
    data[i] = (Math.random()*2-1) * Math.exp(-3 * t) * (Math.sin(60*t*2*Math.PI) * 0.3 + 0.7);
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const g = ctx.createGain();
  g.gain.value = 1.2;
  src.connect(g); g.connect(master);
  src.start();
}

function startPrank() {
  const warning = document.getElementById('warning');
  const reveal = document.getElementById('reveal');
  // Start audio
  let ctx = null;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch(e){ ctx = null; }

  let siren = null;
  if(ctx){
    siren = createSiren(ctx);
  }

  // After WARNING_TIME, stop siren and show reveal
  setTimeout(()=>{
    if(siren && siren.stop) {
      try{siren.stop();}catch(e){}
    }
    // show reveal visually
    reveal.classList.add('show');
    warning.style.filter = 'blur(4px) brightness(0.6)';
    // speak the reveal clearly in Arabic
    const utter = new SpeechSynthesisUtterance('مقلب! لم يتم اختراق جهازك. هذا مجرد مزحة آمنة.');
    utter.lang = 'ar-SA';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);

    // small cheering effect
    if(ctx) playCheer(ctx);
  }, WARNING_TIME);
}

document.addEventListener('DOMContentLoaded', ()=>{
  // start automatically, but allow user to replay via button
  startPrank();

  document.getElementById('retry').addEventListener('click', ()=>{
    // reset reveal
    const reveal = document.getElementById('reveal');
    reveal.classList.remove('show');
    document.getElementById('warning').style.filter = '';
    // small delay then start again
    setTimeout(startPrank, 400);
  });
});
