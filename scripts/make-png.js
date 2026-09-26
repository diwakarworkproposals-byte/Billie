import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function generateIconPNG(size, outPath) {
  const width = size;
  const height = size;
  
  // Create RGBA image buffer (width * height * 4) + filter byte per scanline
  const rowStride = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowStride);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.44;
  const cornerR = width * 0.22;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride;
    rawData[rowOffset] = 0; // Filter byte 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Rounded square background (squircle)
      const dx = Math.max(Math.abs(x - cx) - (width * 0.42 - cornerR), 0);
      const dy = Math.max(Math.abs(y - cy) - (height * 0.42 - cornerR), 0);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= cornerR) {
        // Material 3 Gradient from #2563EB (37, 99, 235) to #0EA5E9 (14, 165, 233)
        const t = (x + y) / (width + height);
        const r = Math.round(37 * (1 - t) + 14 * t);
        const g = Math.round(99 * (1 - t) + 165 * t);
        const b = Math.round(235 * (1 - t) + 233 * t);

        // Draw a stylized "B" & receipt lines in white
        // Normalize coordinates to 0..1 inside the card
        const nx = (x - (width * 0.2)) / (width * 0.6);
        const ny = (y - (height * 0.2)) / (height * 0.6);

        let isWhite = false;

        // Draw 'B' letter on the left side
        if (nx >= 0.15 && nx <= 0.35 && ny >= 0.2 && ny <= 0.8) {
          // Vertical spine of B
          if (nx <= 0.25) isWhite = true;
          // Top loop
          if ((ny >= 0.2 && ny <= 0.28) || (ny >= 0.46 && ny <= 0.54) || (ny >= 0.72 && ny <= 0.8)) {
            isWhite = true;
          }
          if (nx >= 0.28 && ((ny >= 0.2 && ny <= 0.5) || (ny >= 0.48 && ny <= 0.8))) {
            isWhite = true;
          }
        }

        // Draw receipt / invoice list lines on the right side
        if (nx >= 0.45 && nx <= 0.85) {
          if (ny >= 0.25 && ny <= 0.32) isWhite = true;
          if (ny >= 0.40 && ny <= 0.47) isWhite = true;
          if (ny >= 0.55 && ny <= 0.62) isWhite = true;
          if (ny >= 0.70 && ny <= 0.77 && nx <= 0.70) isWhite = true;
        }

        if (isWhite) {
          rawData[pxOffset] = 255;
          rawData[pxOffset + 1] = 255;
          rawData[pxOffset + 2] = 255;
          rawData[pxOffset + 3] = 255;
        } else {
          rawData[pxOffset] = r;
          rawData[pxOffset + 1] = g;
          rawData[pxOffset + 2] = b;
          rawData[pxOffset + 3] = 255;
        }
      } else {
        // Transparent
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  // Deflate
  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression: 0 (deflate)
  ihdr[11] = 0; // Filter: 0 (adaptive)
  ihdr[12] = 0; // Interlace: 0 (no interlace)

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  const png = Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(outPath, png);
  console.log(`Generated ${outPath} (${width}x${height})`);
}

const pubDir = path.resolve('public');
if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });

generateIconPNG(192, path.join(pubDir, 'icon-192.png'));
generateIconPNG(512, path.join(pubDir, 'icon-512.png'));
