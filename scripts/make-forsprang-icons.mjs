#!/usr/bin/env node
/**
 * Builds every Forsprang app picture from the one mark, the ".f Navy" the owner
 * chose on 12 November 2026 (ORDER 272): the icons the Min side manifest and
 * the Android app read, the tab icons, and the 1024x500 feature graphic Google
 * Play asks for.
 *
 *   node scripts/make-forsprang-icons.mjs
 *
 * The master is public/forsprang/forsprang-mark.svg. The glyph is drawn again
 * here (not cut out of the master) so the maskable and adaptive versions can
 * place it inside the safe zone on a full-bleed square.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const out = path.join(root, "public/forsprang");
const NAVY = "#0D1B2A";
const GOLD = "#C9A84C";
const CREAM = "#F4EFE3";

/** The glyph alone, in the master's 100x100 coordinates. */
const GLYPH = `
  <circle cx="30" cy="74" r="7.5" fill="${GOLD}"/>
  <path d="M55 80 V44 Q55 26 73 26" fill="none" stroke="${CREAM}" stroke-width="11" stroke-linecap="round"/>
  <line x1="43" y1="50" x2="68" y2="50" stroke="${CREAM}" stroke-width="9" stroke-linecap="round"/>`;

/** The glyph's own centre, so a scaled copy stays centred. */
const CX = 50.75;
const CY = 53;

function scaled(scale) {
  return `<g transform="translate(50 50) scale(${scale}) translate(${-CX} ${-CY})">${GLYPH}</g>`;
}

const svg = {
  /** As the master: rounded navy square, glyph at full size. */
  rounded: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="${NAVY}"/>${GLYPH}</svg>`,
  /** Full-bleed navy, glyph inside the 80% safe circle a launcher may crop to. */
  maskable: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${NAVY}"/>${scaled(0.72)}</svg>`,
  /** Android adaptive foreground: transparent, glyph inside the 66 of 108 safe zone. */
  foreground: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${scaled(0.58)}</svg>`,
  background: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${NAVY}"/></svg>`,
};

async function png(source, size, file) {
  await sharp(Buffer.from(source), { density: 600 }).resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(out, file));
}

/** One ICO holding a PNG per size, as scripts/make-brand-icons.mjs writes it. */
async function ico(file, sizes) {
  const images = await Promise.all(
    sizes.map(async (size) => ({ size, png: await sharp(Buffer.from(svg.rounded), { density: 600 }).resize(size, size).png().toBuffer() })),
  );
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const directory = Buffer.alloc(16 * images.length);
  let offset = 6 + directory.length;
  images.forEach((image, i) => {
    const at = i * 16;
    directory.writeUInt8(image.size >= 256 ? 0 : image.size, at);
    directory.writeUInt8(image.size >= 256 ? 0 : image.size, at + 1);
    directory.writeUInt8(0, at + 2);
    directory.writeUInt8(0, at + 3);
    directory.writeUInt16LE(1, at + 4);
    directory.writeUInt16LE(32, at + 6);
    directory.writeUInt32LE(image.png.length, at + 8);
    directory.writeUInt32LE(offset, at + 12);
    offset += image.png.length;
  });
  fs.writeFileSync(path.join(out, file), Buffer.concat([header, directory, ...images.map((image) => image.png)]));
}

/** Google Play's 1024x500: navy, the mark left, the name and one line right. */
const feature = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <rect width="1024" height="500" fill="${NAVY}"/>
  <g transform="translate(96 110) scale(2.8)"><rect width="100" height="100" rx="22" fill="#13263A"/>${GLYPH}</g>
  <text x="430" y="238" font-family="Segoe UI, Arial, sans-serif" font-weight="700" font-size="84" fill="${CREAM}">Forsprang</text>
  <text x="432" y="306" font-family="Segoe UI, Arial, sans-serif" font-size="38" fill="${GOLD}">Prosjektene, før de andre</text>
</svg>`;

fs.mkdirSync(out, { recursive: true });
await png(svg.rounded, 512, "icon-512.png");
await png(svg.rounded, 192, "icon-192.png");
await png(svg.rounded, 180, "apple-touch-icon.png");
await png(svg.rounded, 32, "favicon-32.png");
await png(svg.rounded, 16, "favicon-16.png");
await png(svg.maskable, 512, "icon-maskable-512.png");
await png(svg.maskable, 192, "icon-maskable-192.png");
await png(svg.foreground, 432, "adaptive-foreground-432.png");
await png(svg.background, 432, "adaptive-background-432.png");
await ico("favicon.ico", [16, 32, 48]);
await sharp(Buffer.from(feature), { density: 144 }).resize(1024, 500).png({ compressionLevel: 9 }).toFile(path.join(out, "feature-graphic-1024x500.png"));
console.log("written to", path.relative(root, out));
