/* Small helpers shared by the renderer, the build script and the browser. */

/* 100% of blur in the registry equals 42px of CSS blur. */
export const BLUR_FULL_SCALE_PX = 42;

export function escapeHtml(value) {
  return String(value === undefined || value === null ? "" : value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

/*
  Profile content will eventually come from users, so never trust a URL.
  Only https, http, mailto, tel, anchors and site-relative paths survive.
*/
const SAFE_URL = /^(https?:\/\/|mailto:|tel:|\/|\.\/|\.\.\/|#)/i;

export function safeUrl(value) {
  const text = String(value === undefined || value === null ? "" : value).trim();
  if (!text) return "";
  return SAFE_URL.test(text) ? text : "";
}

/* `backgroundBlur` accepts a CSS length ("12px") or a percentage ("15%"). */
export function resolveBlur(value) {
  if (value === undefined || value === null || value === "") return "0px";
  const text = String(value).trim();
  const amount = Number.parseFloat(text);
  if (Number.isNaN(amount)) return "0px";
  if (text.endsWith("%") || /^[\d.]+$/.test(text)) return `${(amount / 100) * BLUR_FULL_SCALE_PX}px`;
  return text;
}

export function absoluteUrl(path, origin) {
  const url = safeUrl(path);
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return new URL(url, origin).href;
}

/* Only one text node per value: keep numbers and booleans predictable. */
export function toText(value) {
  return value === undefined || value === null ? "" : String(value);
}
