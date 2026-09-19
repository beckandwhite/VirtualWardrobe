// Generates tiny placeholder PNGs for the M0-5 studio demo.
// No external deps: builds a valid RGBA PNG by hand via zlib.
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.join(process.cwd(), 'assets', 'sample');
fs.mkdirSync(outDir, { recursive: true });

const WIDTH = 400;
const HEIGHT = 600;

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = crc32(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return c ^ 0xffffffff;
}

function makePng(rgb, a) {
  const [r, g, b] = rgb;
  const rows = [];
  for (let y = 0; y < HEIGHT; y++) {
    const row = Buffer.alloc((WIDTH * 4) + 1);
    row[0] = 0; // filter: none
    for (let x = 0; x < WIDTH; x++) {
      const idx = 1 + x * 4;
      row[idx + 0] = r;
      row[idx + 1] = g;
      row[idx + 2] = b;
      row[idx + 3] = a;
    }
    rows.push(row);
  }
  const raw = Buffer.concat(rows);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(WIDTH, 0);
  ihdr.writeUInt32BE(HEIGHT, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = zlib.deflateSync(raw);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const files = [
  ['garment.png', [40, 90, 180], 255], // blue garment
  ['body.png', [235, 235, 240], 255], // light body backdrop
];

for (const [name, rgb, a] of files) {
  const png = makePng(rgb, a);
  fs.writeFileSync(path.join(outDir, name), png);
  console.log('wrote', path.join(outDir, name), png.length, 'bytes');
}
