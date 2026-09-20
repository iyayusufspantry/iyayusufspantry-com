import { readdir, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("artifacts/screenshots");
await mkdir(root, { recursive: true });
const escape = (text) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
let sections = "";
for (const viewport of ["desktop", "mobile"]) {
  const files = (await readdir(path.join(root, viewport))).filter((file) =>
    file.endsWith(".png"),
  );
  sections += `<section><h2>${viewport === "desktop" ? "Desktop · 1440 px" : "Mobile · 390 px"}</h2><div class="grid">${files.map((file) => `<a href="${viewport}/${encodeURIComponent(file)}"><div class="preview"><img loading="lazy" src="${viewport}/${encodeURIComponent(file)}" alt="${escape(file.replace(".png", ""))} prototype screen"></div><h3>${escape(file.replace(".png", "").replaceAll("-", " "))}</h3><span>Scope prototype · Full page PNG ↗</span></a>`).join("")}</div></section>`;
}
await writeFile(
  path.join(root, "index.html"),
  `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Simbiat · Prototype screenshots</title><style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#29325f;background:#fcfaf5;margin:0;padding:48px 5%}header{max-width:760px;margin-bottom:45px}h1{font-size:40px;letter-spacing:-1.5px;font-weight:500}p{font-size:14px;color:#666;line-height:1.8}h2{font-size:24px;font-weight:500;margin-top:45px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:24px}a{display:block;border:1px solid #d9e2d9;border-radius:16px;padding:15px;color:inherit;text-decoration:none;background:white}.preview{height:260px;overflow:hidden;border:1px solid #eee;background:#f3f3f0}.preview img{width:100%;display:block}h3{font-size:14px;font-weight:500;text-transform:capitalize}span{font-size:11px;color:#666}</style><header><span>PROJECT SCOPE PROTOTYPE</span><h1>Iya Yusuf?s Pantry. A taste of home.</h1><p>Desktop and mobile screenshots of every proposed screen. Click a preview to open the full PNG. Updated brand theme with supplied client photography. Product details, prices, remaining imagery, and editorial copy still require review. This is a prototype.</p></header>${sections}</html>`,
);
console.log("Screenshot gallery: artifacts/screenshots/index.html");
