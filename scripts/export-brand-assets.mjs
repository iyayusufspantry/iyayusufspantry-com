import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

// Use Next's existing Sharp dependency; no additional production dependency.
const require = createRequire(import.meta.url);
const sharp = require(
  require.resolve("sharp", {
    paths: [path.dirname(require.resolve("next/package.json"))],
  }),
);
const output = path.resolve("public/brand");
await mkdir(output, { recursive: true });

// Hand-redrawn geometry based on the client's JPEG. Letterforms are paths,
// not live text, so the artwork is portable and requires no font files.
const letters = {
  I: [8, "M4 4V28"],
  Y: [24, "M3 4L12 16L21 4M12 16V28"],
  A: [24, "M3 28V13Q3 4 12 4Q21 4 21 13V28M3 18H21"],
  U: [24, "M3 4V20Q3 28 12 28Q21 28 21 20V4"],
  S: [
    24,
    "M21 7Q17 3 11 4Q3 4 3 10Q3 15 12 16Q21 17 21 22Q21 29 12 28Q6 28 3 25",
  ],
  F: [24, "M3 28V4H21M3 15H17"],
  P: [24, "M3 28V4H13Q21 4 21 11Q21 18 13 18H3"],
  N: [24, "M3 28V4L21 28V4"],
  T: [24, "M2 4H22M12 4V28"],
  R: [24, "M3 28V4H13Q21 4 21 11Q21 18 13 18H3M12 18L22 28"],
  "'": [7, "M4 1L3 7"],
};
function wordmark(text, x, y, scale = 1) {
  let cursor = 0;
  const paths = [...text].map((letter) => {
    if (letter === " ") {
      cursor += 22;
      return "";
    }
    const [width, d] = letters[letter];
    const result = `<path transform="translate(${cursor} 0)" d="${d}"/>`;
    cursor += width + 12;
    return result;
  });
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="#06ad8f" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round">${paths.join("")}</g>`;
}
const cart = `<g stroke="#29325f" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 14H44L49 32" fill="none"/>
  <path d="M113 45H203L181 130L166 75Z" fill="#06ad8f"/>
  <path d="M56 45H71L153 84L164 133H77Z" fill="#85c83e"/>
  <circle cx="88" cy="164" r="15" fill="#111735"/>
  <circle cx="170" cy="164" r="15" fill="#111735"/>
</g>`;
function svg(width, height, content, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title"><title id="title">${label}</title>${content}</svg>\n`;
}
const variants = [
  [
    "iya-yusufs-pantry-logo",
    svg(
      640,
      300,
      `<g transform="translate(210 12)">${cart}</g>${wordmark("IYA YUSUF'S PANTRY", 20, 239, 1.04)}`,
      "Iya Yusuf's Pantry",
    ),
  ],
  [
    "iya-yusufs-pantry-horizontal",
    svg(
      464,
      104,
      `<g transform="translate(2 4) scale(.51)">${cart}</g>${wordmark("IYA YUSUF'S", 130, 12, 0.92)}${wordmark("PANTRY", 130, 57, 0.92)}`,
      "Iya Yusuf's Pantry",
    ),
  ],
  [
    "iya-yusufs-pantry-icon",
    svg(
      224,
      200,
      `<g transform="translate(4 6)">${cart}</g>`,
      "Iya Yusuf's Pantry cart",
    ),
  ],
];
for (const [name, artwork] of variants) {
  await writeFile(path.join(output, `${name}.svg`), artwork);
  await sharp(Buffer.from(artwork), { density: 216 })
    .png()
    .toFile(path.join(output, `${name}.png`));
  console.log(`Exported ${name}.svg and transparent 3x PNG`);
}

// Next.js discovers these files automatically for browser-tab icons.
const tabIcon = svg(
  224,
  224,
  `<g transform="translate(4 18)">${cart}</g>`,
  "Iya Yusuf's Pantry",
);
await writeFile(path.resolve("app/icon.svg"), tabIcon);
const iconPng = await sharp(Buffer.from(tabIcon))
  .resize(32, 32)
  .png()
  .toBuffer();
// ICO container with one PNG-encoded 32px image.
const iconHeader = Buffer.alloc(22);
iconHeader.writeUInt16LE(1, 2);
iconHeader.writeUInt16LE(1, 4);
iconHeader[6] = 32;
iconHeader[7] = 32;
iconHeader.writeUInt16LE(1, 10);
iconHeader.writeUInt16LE(32, 12);
iconHeader.writeUInt32LE(iconPng.length, 14);
iconHeader.writeUInt32LE(22, 18);
await writeFile(
  path.resolve("app/favicon.ico"),
  Buffer.concat([iconHeader, iconPng]),
);
console.log("Exported app/icon.svg and app/favicon.ico");
