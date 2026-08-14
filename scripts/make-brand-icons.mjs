#!/usr/bin/env node
/**
 * Builds the tab icon and the search-engine logo from the one real mark.
 *
 * WHY IT EXISTS. On 14 August 2026 the owner asked for every logo on the site
 * to be checked because they differed. The worst of them was not a difference:
 * `src/app/favicon.ico` was still the Next.js starter file, byte for byte,
 * dated the same minute as `next.svg` and `vercel.svg`. Every tab anybody has
 * ever opened on arbeidmatch.no has carried Vercel's triangle.
 *
 * Run it after the emblem changes:
 *
 *   node scripts/make-brand-icons.mjs
 *
 * ICO is assembled here rather than taken from a package: the format is a small
 * header plus embedded PNGs, sharp already produces the PNGs, and a dependency
 * for thirty lines of struct writing is a dependency to keep updated forever.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const source = path.join(root, "public/brand/arbeidmatch-emblem.png");
const ICO_SIZES = [16, 32, 48, 256];

if (!fs.existsSync(source)) {
  console.error("the emblem is missing:", source);
  process.exit(1);
}

/** One ICO holding a PNG per size, which every browser since IE11 reads. */
async function writeIco(target) {
  const images = await Promise.all(
    ICO_SIZES.map(async (size) => ({
      size,
      png: await sharp(source)
        .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9, palette: true })
        .toBuffer(),
    })),
  );

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(images.length, 4);

  const directory = Buffer.alloc(16 * images.length);
  let offset = header.length + directory.length;
  images.forEach((img, i) => {
    const at = i * 16;
    directory[at] = img.size >= 256 ? 0 : img.size; // 0 means 256
    directory[at + 1] = img.size >= 256 ? 0 : img.size;
    directory[at + 2] = 0; // colours in palette
    directory[at + 3] = 0; // reserved
    directory.writeUInt16LE(1, at + 4); // colour planes
    directory.writeUInt16LE(32, at + 6); // bits per pixel
    directory.writeUInt32LE(img.png.length, at + 8);
    directory.writeUInt32LE(offset, at + 12);
    offset += img.png.length;
  });

  fs.writeFileSync(target, Buffer.concat([header, directory, ...images.map((i) => i.png)]));
  console.log("favicon.ico:", ICO_SIZES.join(", "), "->", fs.statSync(target).size, "bytes");
}

/**
 * The logo search engines are given, square and on its own ground.
 *
 * schema.org logos are drawn by somebody else's template, so a transparent
 * background lands the gold ring on whatever colour that template happens to
 * use. The old file was the badge on a 1024 by 585 black rectangle, which is
 * neither square nor the mark on its own.
 */
async function writeSquareLogo(target) {
  const buf = await sharp(source)
    .resize(512, 512, { fit: "contain", background: { r: 13, g: 27, b: 42, alpha: 1 } })
    .flatten({ background: { r: 13, g: 27, b: 42 } })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
  fs.writeFileSync(target, buf);
  console.log("logo.png: 512x512 ->", buf.length, "bytes");
}

await writeIco(path.join(root, "src/app/favicon.ico"));
await writeSquareLogo(path.join(root, "public/logo.png"));
