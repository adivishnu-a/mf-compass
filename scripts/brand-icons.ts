// Renders the app icon set from the compass mark: favicon, Apple touch icon, PWA icons (any + maskable).
// Run with `npx tsx scripts/brand-icons.ts` after changing the mark.
import { writeFileSync } from "node:fs";
import sharp from "sharp";

const PEACOCK = "#0A5878";
const MARIGOLD = "#F0A202";
const glyph = `<polygon points="23.5,8.5 18.8,18.8 13.2,13.2" fill="${MARIGOLD}"/><polygon points="8.5,23.5 13.2,13.2 18.8,18.8" fill="#FFFFFF"/>`;

/** Rounded tile for browser tabs; full-bleed square where the platform applies its own mask. */
const mark = (rounded: boolean) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32"${rounded ? ' rx="7.2"' : ""} fill="${PEACOCK}"/>${glyph}</svg>`;

const png = (svg: string, size: number) =>
  sharp(Buffer.from(svg), { density: 72 * (size / 32) * 2 })
    .resize(size, size)
    .png()
    .toBuffer();

/** ICO container holding PNG images (supported by every current browser). */
function ico(images: { size: number; data: Buffer }[]) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const at = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, at);
    header.writeUInt8(size >= 256 ? 0 : size, at + 1);
    header.writeUInt16LE(1, at + 4);
    header.writeUInt16LE(32, at + 6);
    header.writeUInt32LE(data.length, at + 8);
    header.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.data)]);
}

(async () => {
  writeFileSync("src/app/icon.svg", mark(true));
  writeFileSync("src/app/apple-icon.png", await png(mark(false), 180));
  writeFileSync("public/icons/icon-192.png", await png(mark(true), 192));
  writeFileSync("public/icons/icon-512.png", await png(mark(true), 512));
  writeFileSync(
    "public/icons/icon-512-maskable.png",
    await png(mark(false), 512),
  );
  writeFileSync(
    "src/app/favicon.ico",
    ico([
      { size: 16, data: await png(mark(true), 16) },
      { size: 32, data: await png(mark(true), 32) },
      { size: 48, data: await png(mark(true), 48) },
    ]),
  );
})();
