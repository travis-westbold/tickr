// Simulate the ticker page: stub DOM/canvas, run the inline script, dump framebuffers.
const fs = require('fs');

const W = 192, H = 32;

const ctx = {
  createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
  putImageData: () => {},
  fillRect: () => {}, beginPath: () => {}, arc: () => {}, fill: () => {}, drawImage: () => {},
};

const dummyEl = () => ({
  textContent: '', innerHTML: '', value: '', checked: false,
  addEventListener() {}, appendChild() {},
  querySelector: () => null, querySelectorAll: () => [],
});

global.document = {
  getElementById(id) {
    if (id === 'ticker') return { getContext: () => ctx, width: W, height: H };
    return dummyEl();
  },
};
global.window = global;
global.localStorage = { getItem: () => null, setItem() {} };
global.fetch = () => Promise.reject(new Error('offline sim'));
const timers = [];
global.setInterval = (fn, ms) => { timers.push({ fn, ms }); };

const html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
eval(script);

const palette = {}; // 565 value -> display char
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij';
function dump(title) {
  const buf = global.window.ticker.buffer;
  const rows = [];
  for (let y = 0; y < H; y++) {
    let row = '';
    for (let x = 0; x < W; x++) {
      const v = buf[y * W + x];
      if (v === 0) { row += '.'; continue; }
      if (!(v in palette)) palette[v] = CHARS[Object.keys(palette).length] || '#';
      row += palette[v];
    }
    rows.push(row);
  }
  console.log(`--- ${title} ---`);
  console.log(rows.join('\n'));
}

setTimeout(() => {
  const anim = timers.find(t => t.ms === 50);
  anim.fn();
  dump('tick 1: weather');
  // weather shows 12s = 240 ticks, then a 0.7s wipe transition (14 ticks)
  for (let i = 1; i < 247; i++) anim.fn();
  dump('tick 247: mid-transition weather -> clock (wipe)');
  for (let i = 0; i < 10; i++) anim.fn();
  dump('tick 257: clock');
  // clock 8s = 160 ticks; jump into headlines
  for (let i = 0; i < 175; i++) anim.fn();
  dump('tick 432: headlines');
  console.log('legend:', Object.entries(palette)
    .map(([v, ch]) => `${ch}=0x${(+v).toString(16).padStart(4, '0')}`).join(' '));
}, 50);
