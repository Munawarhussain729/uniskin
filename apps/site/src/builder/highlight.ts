/**
 * Minimal syntax highlighting for the export panel — a hand-rolled,
 * dependency-free tokenizer. It only has to look decent on the two shapes
 * the builder emits (a JS adapter file, a CSS variables snippet), not parse
 * arbitrary code. Output is HTML; every non-token byte is escaped.
 */

export type HighlightLang = "js" | "css";

const escMap: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
const esc = (s: string): string => s.replace(/[&<>]/g, (c) => escMap[c]);
const span = (cls: string, s: string): string => `<span class="${cls}">${esc(s)}</span>`;

interface Seg {
  com: boolean;
  text: string;
}

/* Splits a line into code/comment segments; tracks /* … *\/ across lines. */
function splitLine(line: string, inCom: boolean, lineCom: boolean): { segs: Seg[]; inCom: boolean } {
  const segs: Seg[] = [];
  let cur = "";
  let i = 0;
  const push = (com: boolean) => {
    if (cur) segs.push({ com, text: cur });
    cur = "";
  };
  while (i < line.length) {
    if (inCom) {
      const end = line.indexOf("*/", i);
      if (end === -1) {
        cur += line.slice(i);
        i = line.length;
      } else {
        cur += line.slice(i, end + 2);
        push(true);
        i = end + 2;
        inCom = false;
      }
      continue;
    }
    const block = line.indexOf("/*", i);
    const slash = lineCom ? line.indexOf("//", i) : -1;
    if (block === -1 && slash === -1) {
      cur += line.slice(i);
      break;
    }
    const at = block !== -1 && (slash === -1 || block < slash) ? block : slash;
    cur += line.slice(i, at);
    push(false);
    if (at === slash) {
      /* // comment runs to end of line */
      segs.push({ com: true, text: line.slice(at) });
      return { segs, inCom };
    }
    i = at;
    inCom = true;
  }
  push(inCom);
  return { segs, inCom };
}

const JS_TOK = /("(?:[^"\\]|\\.)*")|\b(import|export|default|from)\b|(-?\d*\.?\d+(?:e[+-]?\d+)?)/g;

function tokJs(code: string): string {
  let out = "";
  let last = 0;
  JS_TOK.lastIndex = 0;
  for (let m; (m = JS_TOK.exec(code)); ) {
    out += esc(code.slice(last, m.index));
    out += span(m[1] ? "t-s" : m[2] ? "t-k" : "t-n", m[0]);
    last = m.index + m[0].length;
  }
  return out + esc(code.slice(last));
}

/* At-rule / selector prelude: the chunk before a `{`. */
const PRE_TOK = /(@[\w-]+)|("[^"]*"|'[^']*')/g;

function tokPrelude(code: string): string {
  let out = "";
  let last = 0;
  PRE_TOK.lastIndex = 0;
  for (let m; (m = PRE_TOK.exec(code)); ) {
    out += esc(code.slice(last, m.index));
    out += span(m[1] ? "t-k" : "t-s", m[0]);
    last = m.index + m[0].length;
  }
  return out + esc(code.slice(last));
}

/* Inside rule bodies: at-words, strings, hex colours, numbers, everything else plain. */
const CSS_TOK = /(@[\w-]+)|("[^"]*"|'[^']*')|(#[0-9a-fA-F]{3,8}\b)|(-?[.\w]+)/g;

function tokCssText(code: string): string {
  let out = "";
  let last = 0;
  CSS_TOK.lastIndex = 0;
  for (let m; (m = CSS_TOK.exec(code)); ) {
    out += esc(code.slice(last, m.index));
    if (m[4] && !/^-?\d/.test(m[4])) {
      /* identifier/property — leave unstyled */
      out += esc(m[0]);
    } else {
      out += span(m[1] ? "t-k" : m[2] ? "t-s" : "t-n", m[0]);
    }
    last = m.index + m[0].length;
  }
  return out + esc(code.slice(last));
}

function tokCss(code: string): string {
  let out = "";
  let s = code;
  for (;;) {
    const brace = s.indexOf("{");
    if (brace === -1) {
      out += tokCssText(s);
      break;
    }
    out += tokPrelude(s.slice(0, brace)) + "{";
    s = s.slice(brace + 1);
  }
  return out;
}

/** Returns `code` as HTML with token spans (t-c comment, t-k keyword, t-s string, t-n number). */
export function highlight(code: string, lang: HighlightLang): string {
  let inCom = false;
  return code
    .split("\n")
    .map((line) => {
      const r = splitLine(line, inCom, lang === "js");
      inCom = r.inCom;
      return r.segs
        .map((seg) => (seg.com ? span("t-c", seg.text) : lang === "js" ? tokJs(seg.text) : tokCss(seg.text)))
        .join("");
    })
    .join("\n");
}
