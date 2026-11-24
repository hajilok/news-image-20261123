import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_BYTES = 1048576;
const MAX_DIMENSION = 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function buildCrc32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = buildCrc32Table();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function validatePng(data: Buffer): { width: number; height: number } {
  let offset = 8;
  let width = 0;
  let height = 0;
  let sawIhdr = false;
  let sawIend = false;

  while (offset + 12 <= data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.toString('ascii', offset + 4, offset + 8);
    const chunkEnd = offset + 8 + length;
    if (chunkEnd + 4 > data.length) {
      throw new Error(`Truncated PNG chunk ${type}`);
    }
    const expectedCrc = data.readUInt32BE(chunkEnd);
    const actualCrc = crc32(data.subarray(offset + 4, chunkEnd));
    if (actualCrc !== expectedCrc) {
      throw new Error(`CRC mismatch in PNG chunk ${type}`);
    }
    if (type === 'IHDR') {
      width = data.readUInt32BE(offset + 8);
      height = data.readUInt32BE(offset + 12);
      sawIhdr = true;
    } else if (type === 'IEND') {
      sawIend = true;
      offset = chunkEnd + 4;
      break;
    }
    offset = chunkEnd + 4;
  }

  if (!sawIhdr || !sawIend) {
    throw new Error('Incomplete PNG stream: missing IHDR or IEND');
  }
  return { width, height };
}

function validateJpeg(data: Buffer): { width: number; height: number } {
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) {
    throw new Error('Invalid JPEG SOI header');
  }
  if (data[data.length - 2] !== 0xff || data[data.length - 1] !== 0xd9) {
    throw new Error('Truncated JPEG: missing EOI marker');
  }

  let offset = 2;
  let width = 0;
  let height = 0;

  while (offset + 4 < data.length) {
    if (data[offset] !== 0xff) {
      throw new Error(`Unexpected JPEG marker byte at offset ${offset}`);
    }
    while (offset < data.length && data[offset] === 0xff) {
      offset++;
    }
    const marker = data[offset++];
    if (marker === 0xd9 || marker === 0xda) {
      break;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue;
    }
    const segLen = data.readUInt16BE(offset);
    if (segLen < 2 || offset + segLen > data.length) {
      throw new Error(`Invalid JPEG segment length for marker 0x${marker.toString(16)}`);
    }
    const isSof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isSof && segLen >= 7) {
      height = data.readUInt16BE(offset + 3);
      width = data.readUInt16BE(offset + 5);
    }
    offset += segLen;
  }

  if (width === 0 || height === 0) {
    throw new Error('JPEG missing SOF dimension header');
  }
  return { width, height };
}

function validateImageBytes(data: Buffer): { format: 'PNG' | 'JPEG'; width: number; height: number } {
  if (data.length === 0 || data.length > MAX_BYTES) {
    throw new Error(`Image size ${data.length} bytes exceeds limit ${MAX_BYTES}`);
  }
  if (data.length >= 8 && data.subarray(0, 8).equals(PNG_SIGNATURE)) {
    const dims = validatePng(data);
    if (dims.width > MAX_DIMENSION || dims.height > MAX_DIMENSION) {
      throw new Error(`PNG dimensions ${dims.width}x${dims.height} exceed ${MAX_DIMENSION}x${MAX_DIMENSION}`);
    }
    return { format: 'PNG', ...dims };
  }
  if (data.length >= 4 && data[0] === 0xff && data[1] === 0xd8) {
    const dims = validateJpeg(data);
    if (dims.width > MAX_DIMENSION || dims.height > MAX_DIMENSION) {
      throw new Error(`JPEG dimensions ${dims.width}x${dims.height} exceed ${MAX_DIMENSION}x${MAX_DIMENSION}`);
    }
    return { format: 'JPEG', ...dims };
  }
  throw new Error('Unsupported image format: expected whole PNG or JPEG');
}

function run(): void {
  const repoDir = dirname(fileURLToPath(import.meta.url));
  const sourcePath = resolve(repoDir, 'entry.png');
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  const outputPath = join(outputDir, 'entry.png');

  const payload = readFileSync(sourcePath);
  const meta = validateImageBytes(payload);
  const digest = createHash('sha256').update(payload).digest('hex');

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, payload, { mode: 0o644 });

  const written = readFileSync(outputPath);
  if (!written.equals(payload)) {
    throw new Error(`Post-write verification failed for ${outputPath}`);
  }
  if (process.env.MAKEFUN_VERBOSE === '1') {
    console.log(`${meta.format} ${meta.width}x${meta.height} ${payload.length}B sha256=${digest}`);
  }
}

run();
