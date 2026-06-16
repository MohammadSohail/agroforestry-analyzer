// Generates small, dependency-free procedural "aerial canopy" PNGs used by the
// dashboard's "Try a sample" buttons. Run: `node apps/web/scripts/generate-samples.mjs`
// Output: apps/web/public/samples/*.png
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'samples');
const W = 480;
const H = 360;

// CRC32 (table) — avoids relying on a specific Node version's zlib.crc32.
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePng(rgb) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(2, 9); // color type RGB
  // rows prefixed with filter byte 0
  const raw = Buffer.alloc(H * (W * 3 + 1));
  for (let y = 0; y < H; y++) {
    raw[y * (W * 3 + 1)] = 0;
    rgb.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3);
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Tiny seeded PRNG so output is reproducible.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function render({ seed, ground, crowns, crownColor, jitter }) {
  const rng = mulberry32(seed);
  const buf = Buffer.alloc(W * H * 3);
  // ground fill
  for (let i = 0; i < W * H; i++) {
    buf[i * 3] = ground[0];
    buf[i * 3 + 1] = ground[1];
    buf[i * 3 + 2] = ground[2];
  }
  // draw tree crowns as soft circles
  for (let c = 0; c < crowns; c++) {
    const cx = Math.floor(rng() * W);
    const cy = Math.floor(rng() * H);
    const r = 6 + rng() * 16;
    const tint = crownColor(rng);
    for (let y = Math.max(0, cy - r); y < Math.min(H, cy + r); y++) {
      for (let x = Math.max(0, cx - r); x < Math.min(W, cx + r); x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d > r) continue;
        const falloff = 1 - d / r;
        const j = (rng() - 0.5) * jitter;
        const i = (y * W + x) * 3;
        buf[i] = clamp(tint[0] + j, buf[i], falloff);
        buf[i + 1] = clamp(tint[1] + j, buf[i + 1], falloff);
        buf[i + 2] = clamp(tint[2] + j, buf[i + 2], falloff);
      }
    }
  }
  return buf;
}
function clamp(target, base, t) {
  const v = base + (target - base) * t;
  return Math.max(0, Math.min(255, Math.round(v)));
}

const SAMPLES = {
  'canopy-dense': {
    seed: 101,
    ground: [38, 70, 38],
    crowns: 900,
    jitter: 30,
    crownColor: (r) => [20 + r * 30, 90 + r * 60, 25 + r * 30],
  },
  'canopy-sparse': {
    seed: 202,
    ground: [120, 96, 60],
    crowns: 220,
    jitter: 26,
    crownColor: (r) => [30 + r * 35, 95 + r * 55, 30 + r * 30],
  },
  'canopy-stressed': {
    seed: 303,
    ground: [96, 84, 44],
    crowns: 520,
    jitter: 40,
    crownColor: (r) => [110 + r * 60, 110 + r * 50, 30 + r * 25],
  },
};

mkdirSync(OUT, { recursive: true });
for (const [name, cfg] of Object.entries(SAMPLES)) {
  const png = encodePng(render(cfg));
  writeFileSync(join(OUT, `${name}.png`), png);
  // eslint-disable-next-line no-console
  console.log(`wrote ${name}.png (${png.length} bytes)`);
}
