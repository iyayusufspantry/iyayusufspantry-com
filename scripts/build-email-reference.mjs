// Build an offline reference from authorized Gmail exports in ignored artifacts.
import { chromium } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
const folder = resolve("artifacts/email-intake-2026-10-05");
const messages = JSON.parse(await readFile(`${folder}/messages.json`, "utf8"));
const files = JSON.parse(
  await readFile(`${folder}/attachment-manifest.json`, "utf8"),
);
const escape = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const flatten = (p) => [p, ...(p.parts || []).flatMap(flatten)];
const header = (m, name) =>
  m.payload.headers.find((h) => h.name.toLowerCase() === name)?.value || "";
const content = (p) =>
  p?.body?.content ??
  (p?.body?.base64_url_content
    ? Buffer.from(p.body.base64_url_content, "base64url").toString("utf8")
    : "");
const browser = await chromium.launch();
const page = await browser.newPage();
const rows = [];
try {
  for (const m of messages.sort(
    (a, b) => Number(b.internal_date) - Number(a.internal_date),
  )) {
    const parts = flatten(m.payload),
      attachments = parts.filter((p) => p.filename && p.body?.attachment_id);
    const links = attachments.map((p) => {
      const f = files.find(
        (f) => f.filename === p.filename && f.size === p.body.size,
      );
      if (!f?.path) throw Error(`Missing attachment ${m.id} ${p.filename}`);
      return {
        filename: p.filename,
        cid: p.headers
          ?.find((h) => h.name.toLowerCase() === "content-id")
          ?.value?.replace(/^<|>$/g, ""),
        mime: p.mime_type,
        path: relative(folder, f.path)
          .split("\\")
          .map(encodeURIComponent)
          .join("/"),
      };
    });
    const plain = content(parts.find((p) => p.mime_type === "text/plain"));
    const rawHtml = content(parts.find((p) => p.mime_type === "text/html"));
    const sanitized = await page.evaluate(
      ({ html, links }) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        doc
          .querySelectorAll(
            "script,style,iframe,object,embed,form,meta,link,base,svg,math,template",
          )
          .forEach((n) => n.remove());
        const images = [];
        for (const n of Array.from(doc.body.querySelectorAll("*"))) {
          if (n.tagName === "IMG") {
            const src = n.getAttribute("src") || "",
              f = links.find((f) => src === `cid:${f.cid}`);
            const before = [];
            const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
            let text;
            while ((text = walker.nextNode())) {
              if (
                n.compareDocumentPosition(text) &
                Node.DOCUMENT_POSITION_PRECEDING
              )
                before.push(text.textContent);
            }
            if (f) {
              images.push({
                filename: f.filename,
                context: before
                  .join(" ")
                  .replace(/\s+/g, " ")
                  .trim()
                  .slice(-400),
              });
              const alt = n.getAttribute("alt") || f.filename;
              for (const a of Array.from(n.attributes))
                n.removeAttribute(a.name);
              n.setAttribute("src", f.path);
              n.setAttribute("alt", alt);
              n.setAttribute("loading", "lazy");
            } else
              n.replaceWith(
                doc.createTextNode("[External email image omitted]"),
              );
          } else {
            const href = n.tagName === "A" ? n.getAttribute("href") : null;
            for (const a of Array.from(n.attributes)) n.removeAttribute(a.name);
            if (href && /^(https?:|mailto:)/i.test(href)) {
              n.setAttribute("href", href);
              n.setAttribute("rel", "noopener noreferrer");
              n.setAttribute("target", "_blank");
            }
            if (
              ![
                "A",
                "DIV",
                "SPAN",
                "P",
                "BR",
                "B",
                "STRONG",
                "I",
                "EM",
                "U",
                "S",
                "BLOCKQUOTE",
                "UL",
                "OL",
                "LI",
                "TABLE",
                "TBODY",
                "THEAD",
                "TR",
                "TD",
                "TH",
                "HR",
                "H1",
                "H2",
                "H3",
                "H4",
                "H5",
                "H6",
                "PRE",
                "CODE",
              ].includes(n.tagName)
            )
              n.replaceWith(...n.childNodes);
          }
        }
        return { html: doc.body.innerHTML, images };
      },
      { html: rawHtml, links },
    );
    rows.push({
      id: m.id,
      threadId: m.thread_id,
      date: new Date(Number(m.internal_date)).toISOString(),
      from: header(m, "from"),
      to: header(m, "to"),
      subject: header(m, "subject"),
      plain,
      html: sanitized.html,
      imageContext: sanitized.images,
      attachments: links,
    });
  }
} finally {
  await browser.close();
}
await writeFile(`${folder}/context.json`, JSON.stringify(rows, null, 2));
const cards = rows
  .map(
    (r) =>
      `<details id="${r.id}"><summary><time>${escape(r.date.slice(0, 10))}</time> ${escape(r.subject)} <small>${escape(r.from)}</small></summary><div class="message"><p><a href="https://mail.google.com/mail/u/0/#all/${r.id}" target="_blank" rel="noopener noreferrer">Open original in Gmail</a> · ${escape(r.date)}</p><div class="body">${r.html || `<pre>${escape(r.plain)}</pre>`}</div><details><summary>Plain-text copy</summary><pre>${escape(r.plain)}</pre></details><div class="attachments">${r.attachments.map((f) => `<figure>${f.mime.startsWith("image/") ? `<a href="${f.path}"><img src="${f.path}" alt="${escape(f.filename)}" loading="lazy"></a>` : ""}<figcaption><a href="${f.path}">${escape(f.filename)}</a></figcaption></figure>`).join("")}</div></div></details>`,
  )
  .join("\n");
await writeFile(
  `${folder}/index.html`,
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src file: data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Simbiat — complete email reference</title><style>body{font:16px/1.6 system-ui;background:#f7f5ef;color:#23332f;max-width:1100px;margin:40px auto;padding:20px}h1{font-size:30px}input{box-sizing:border-box;width:100%;padding:14px;margin:20px 0;font:inherit}details{background:white;border:1px solid #ddd;border-radius:8px;margin:12px 0;padding:15px}summary{cursor:pointer;font-weight:600}small{display:block;color:#58655f;font-weight:400}.message{padding-top:20px;overflow-wrap:anywhere}.body img{display:block;max-width:min(100%,680px);max-height:650px;object-fit:contain;margin:20px 0}table{max-width:100%;table-layout:fixed}blockquote{border-left:3px solid #ddd;padding-left:20px;margin-left:10px}pre{white-space:pre-wrap;overflow-wrap:anywhere}.attachments{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:20px}.attachments img{width:100%;height:200px;object-fit:contain}.attachments figure{margin:0}figcaption{font-size:12px}a{color:#007b65}time{color:#64736c;margin-right:14px}[hidden]{display:none}</style></head><body><h1>Simbiat's email correspondence</h1><p>${rows.length} messages · ${files.length} distinct attachments · collected from zulzdn@gmail.com on October 5, 2026. Original inline images remain beside their email context. Quoted replies are preserved. This private local reference includes account and payment correspondence and is excluded from the website and Git.</p><label for="search">Search emails</label><input id="search" type="search" placeholder="Product, request, subject or sender"><main>${cards}</main><script>document.getElementById('search').addEventListener('input',function(){const term=this.value.toLowerCase();document.querySelectorAll('main>details').forEach(row=>{row.hidden=!row.textContent.toLowerCase().includes(term)});});</script></body></html>`,
);
console.log(
  JSON.stringify({
    messages: rows.length,
    attachments: files.length,
    inlineContexts: rows.reduce((n, r) => n + r.imageContext.length, 0),
  }),
);
