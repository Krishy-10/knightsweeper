const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation for standard PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function createPng(width, height, isMaskable = false) {
  // 1. Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // 2. IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Non-interlaced
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // 3. Pixel Data
  const stride = width * 4;
  const rawData = Buffer.alloc((1 + stride) * height);

  // Colors
  // Base dark tile: #18232c -> [24, 35, 44]
  // Highlight tile: #223340 -> [34, 51, 64]
  // Border: #476274 -> [71, 98, 116]
  // Gold accent: #d49a18 -> [212, 154, 24]
  // Knight white: #f8fafc -> [248, 250, 252]
  // Shadow: [15, 23, 30]

  const cornerRadius = isMaskable ? 0 : Math.round(width * 0.2);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + stride);
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Rounded rectangle mask (unless maskable)
      let inside = true;
      if (cornerRadius > 0) {
        const dx = Math.max(0, Math.max(cornerRadius - x, x - (width - 1 - cornerRadius)));
        const dy = Math.max(0, Math.max(cornerRadius - y, y - (height - 1 - cornerRadius)));
        if (dx * dx + dy * dy > cornerRadius * cornerRadius) {
          inside = false;
        }
      }

      if (!inside) {
        // Transparent
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
        continue;
      }

      // Normalized coordinates [0..1]
      const nx = x / width;
      const ny = y / height;

      // Subtle diagonal gradient
      const grad = nx * 0.3 + ny * 0.7;
      let r = Math.round(34 * (1 - grad) + 18 * grad);
      let g = Math.round(51 * (1 - grad) + 27 * grad);
      let b = Math.round(64 * (1 - grad) + 36 * grad);
      let a = 255;

      // Subtle border stroke
      if (!isMaskable && (x <= 2 || x >= width - 3 || y <= 2 || y >= height - 3)) {
        r = 71;
        g = 98;
        b = 116;
      }

      // Top right golden King crown aura: center ~(0.78, 0.22), radius ~0.25
      const kdx = nx - 0.78;
      const kdy = ny - 0.22;
      const kdist = Math.sqrt(kdx * kdx + kdy * kdy);
      if (kdist < 0.28) {
        const glow = Math.max(0, 1 - kdist / 0.28);
        r = Math.min(255, Math.round(r + 212 * glow * 0.45));
        g = Math.min(255, Math.round(g + 154 * glow * 0.45));
        b = Math.min(255, Math.round(b + 24 * glow * 0.45));
      }

      // Knight piece body representation (center-left)
      // Knight silhouette approximation bounding box [nx: 0.25..0.68, ny: 0.25..0.82]
      const kx = (nx - 0.20) / 0.55;
      const ky = (ny - 0.22) / 0.60;

      if (kx >= 0 && kx <= 1 && ky >= 0 && ky <= 1) {
        // Mane & back profile
        const isBack = kx >= 0.35 && kx <= 0.85 && ky >= 0.15 && ky <= 0.88;
        // Head & snout profile
        const isHead = kx >= 0.08 && kx <= 0.55 && ky >= 0.08 && ky <= 0.52;
        // Muzzle
        const isMuzzle = kx >= 0.02 && kx <= 0.30 && ky >= 0.25 && ky <= 0.48;
        // Base pedestal
        const isBase = kx >= 0.20 && kx <= 0.85 && ky >= 0.75 && ky <= 0.90;

        if ((isBack || isHead || isMuzzle || isBase)) {
          // Inner knight white/ivory
          r = 248;
          g = 250;
          b = 252;

          // Eye spot ~(0.35, 0.28 in k-space)
          const eyeDist = Math.hypot(kx - 0.36, ky - 0.28);
          if (eyeDist < 0.04) {
            r = 24;
            g = 35;
            b = 44;
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // 4. Compress IDAT
  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);

  // 5. IEND Chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.join(__dirname, '..', 'public');

// Output target sizes
const targets = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'apple-touch-icon.png', size: 180, maskable: false },
  { file: 'icon-maskable.png', size: 512, maskable: true },
];

targets.forEach(({ file, size, maskable }) => {
  const pngBuf = createPng(size, size, maskable);
  const outPath = path.join(publicDir, file);
  fs.writeFileSync(outPath, pngBuf);
  console.log(`Generated: ${file} (${size}x${size}, ${pngBuf.length} bytes)`);
});
