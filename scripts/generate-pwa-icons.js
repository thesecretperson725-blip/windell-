import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// Helper to calculate CRC32 for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
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
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crcTarget = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  chunk.writeUInt32BE(crc32(crcTarget), 8 + len);
  return chunk;
}

function createPng(width, height, isMaskable = false) {
  // Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // Color type: RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // No interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw pixel data: each scanline starts with filter byte 0
  const rowStride = 1 + width * 4;
  const rawData = Buffer.alloc(rowStride * height);

  const cx = width / 2;
  const cy = height / 2;
  const maxR = width / 2;
  const qrR = isMaskable ? maxR * 0.65 : maxR * 0.85;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background: Deep Slate Navy (#090d16 -> #1e1b4b)
      let r = 15;
      let g = 23;
      let b = 42;
      let a = 255;

      // Outer gold circle boundary
      if (dist < qrR) {
        // Gold rim
        if (dist > qrR - 6) {
          r = 217; g = 119; b = 6; a = 255; // amber-600
        } else if (dist > qrR - 10) {
          r = 245; g = 158; b = 11; a = 255; // amber-500
        } else {
          // Inside emblem: rich indigo gradient
          const factor = (y / height);
          r = Math.floor(30 + 20 * factor);
          g = Math.floor(41 + 15 * factor);
          b = Math.floor(89 + 60 * factor);

          // Center QR grid styling
          const boxSize = isMaskable ? width * 0.42 : width * 0.48;
          const left = cx - boxSize / 2;
          const top = cy - boxSize / 2;

          if (x >= left && x <= left + boxSize && y >= top && y <= top + boxSize) {
            // White card background
            r = 255; g = 255; b = 255;

            // Simplified QR corner finder patterns
            const normX = (x - left) / boxSize;
            const normY = (y - top) / boxSize;

            const inTopLeft = (normX < 0.32 && normY < 0.32);
            const inTopRight = (normX > 0.68 && normY < 0.32);
            const inBottomLeft = (normX < 0.32 && normY > 0.68);

            if (inTopLeft || inTopRight || inBottomLeft) {
              const lx = inTopRight ? normX - 0.68 : normX;
              const ly = inBottomLeft ? normY - 0.68 : normY;
              const isBorder = (lx < 0.05 || lx > 0.27 || ly < 0.05 || ly > 0.27);
              const isInner = (lx >= 0.10 && lx <= 0.22 && ly >= 0.10 && ly <= 0.22);
              if (isBorder || isInner) {
                r = 15; g = 23; b = 42; // dark navy
              }
            } else {
              // Internal pseudo data grid
              const cellX = Math.floor(normX * 10);
              const cellY = Math.floor(normY * 10);
              if ((cellX + cellY * 3) % 2 === 0 && (cellX > 2 && cellX < 8)) {
                r = 67; g = 56; b = 202; // indigo-700
              }
            }
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // Compress IDAT
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PWA Icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, false));

// Generate SVG Icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e1b4b" />
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#bg)" />
  <circle cx="256" cy="256" r="210" fill="none" stroke="url(#gold)" stroke-width="12" />
  <rect x="136" y="136" width="240" height="240" rx="32" fill="#ffffff" />
  <!-- QR Finder Patterns -->
  <rect x="160" y="160" width="60" height="60" rx="10" fill="none" stroke="#0f172a" stroke-width="12" />
  <rect x="176" y="176" width="28" height="28" rx="4" fill="#0f172a" />
  <rect x="292" y="160" width="60" height="60" rx="10" fill="none" stroke="#0f172a" stroke-width="12" />
  <rect x="308" y="176" width="28" height="28" rx="4" fill="#0f172a" />
  <rect x="160" y="292" width="60" height="60" rx="10" fill="none" stroke="#0f172a" stroke-width="12" />
  <rect x="176" y="308" width="28" height="28" rx="4" fill="#0f172a" />
  <!-- QR Center Pattern -->
  <rect x="240" y="240" width="32" height="32" rx="6" fill="#4f46e5" />
  <rect x="288" y="240" width="24" height="24" rx="4" fill="#0f172a" />
  <rect x="240" y="288" width="24" height="24" rx="4" fill="#0f172a" />
  <rect x="280" y="280" width="36" height="36" rx="6" fill="#10b981" />
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
console.log('PWA icons generated successfully in public/');
