/*
  Dependency-free test suite: runs with `npm test` (node --test tests/).
  It covers the pure helpers, the rendered markup and the generated pages.
*/

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PROFILES, DEFAULT_SLUG } from "../data/profiles.js";
import { SITE } from "../src/config.js";
import { buildViewModel } from "../src/render.js";
import { render } from "../tools/build.mjs";
import { FALLBACK_LANG, LANGS, normalizeLang, uiStrings } from "../src/i18n.js";
import { escapeHtml, resolveBlur, safeUrl } from "../src/utils.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const read = (relative) => readFile(path.join(ROOT, relative), "utf8");
const exists = (relative) => stat(path.join(ROOT, relative)).then(() => true, () => false);

const MINIMAL = {
  name: "Test",
  handle: "@test",
  avatar: "/assets/img/test.jpg",
  background: "/assets/img/test.jpg",
  links: [],
  social: [],
};

test("safeUrl blocks script and data URLs", () => {
  assert.equal(safeUrl("javascript:alert(1)"), "");
  assert.equal(safeUrl("JavaScript:alert(1)"), "");
  assert.equal(safeUrl("data:text/html,<script>"), "");
  assert.equal(safeUrl("vbscript:msgbox"), "");
  assert.equal(safeUrl(""), "");
  assert.equal(safeUrl(undefined), "");
});

test("safeUrl keeps http, mailto, tel and relative URLs", () => {
  assert.equal(safeUrl("https://example.com/a"), "https://example.com/a");
  assert.equal(safeUrl("mailto:hi@example.com"), "mailto:hi@example.com");
  assert.equal(safeUrl("tel:+34600000000"), "tel:+34600000000");
  assert.equal(safeUrl("/assets/img/a.jpg"), "/assets/img/a.jpg");
  assert.equal(safeUrl("  https://example.com  "), "https://example.com");
});

test("escapeHtml neutralises markup", () => {
  assert.equal(escapeHtml('<img src=x onerror="a">'), "&lt;img src=x onerror=&quot;a&quot;&gt;");
  assert.equal(escapeHtml("Tom & Jerry's"), "Tom &amp; Jerry&#39;s");
  assert.equal(escapeHtml(null), "");
});

test("resolveBlur understands percentages and lengths", () => {
  assert.equal(resolveBlur("100%"), "42px");
  assert.equal(resolveBlur("15%"), "6.3px");
  assert.equal(resolveBlur("6px"), "6px");
  assert.equal(resolveBlur(""), "0px");
});

test("profile text is escaped in fragments and generated pages", async () => {
  const template = await read("src/template.html");
  const nasty = {
    ...MINIMAL,
    name: "<script>alert(1)</script>",
    bio: '"><img src=x onerror=alert(1)>',
    links: [{ title: "<b>bold</b>", url: "https://example.com", kind: "link" }],
  };
  const view = buildViewModel(nasty, { slug: "x" });
  const html = render(template, view, "x");

  assert.ok(!html.includes("<script>alert(1)</script>"), "name must not break out of the markup");
  assert.ok(!html.includes("<img src=x onerror"), "bio must not break out of the markup");
  assert.ok(!view.linksHtml.includes("<b>bold</b>"), "link titles must be escaped");
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(!html.includes("{{"), "every token must be substituted");
});

test("unsafe links are dropped and sensitive cards become buttons", () => {
  const view = buildViewModel({
    ...MINIMAL,
    links: [
      { title: "Evil", url: "javascript:alert(1)" },
      { title: "Safe", url: "https://example.com", kind: "link" },
      { title: "Adult", url: "https://example.com/adult", kind: "onlyfans", sensitive: true },
    ],
  }, { slug: "x" });

  assert.ok(!view.linksHtml.includes("javascript:"));
  assert.ok(view.linksHtml.includes('href="https://example.com"'));
  assert.ok(view.linksHtml.includes('data-sensitive-url="https://example.com/adult"'));
  assert.ok(view.linksHtml.includes("<button"), "sensitive link must not be an anchor");
});

test("featured cards only carry the 18+ badge when sensitive", () => {
  const base = { ...MINIMAL, featuredLink: { title: "Featured", note: "note", url: "https://example.com", image: "/assets/img/a.jpg" } };
  const plain = buildViewModel(base, { slug: "x" });
  const gated = buildViewModel({ ...base, featuredLink: { ...base.featuredLink, sensitive: true } }, { slug: "x" });

  assert.ok(!plain.featuredHtml.includes("18+"));
  assert.ok(!plain.featuredHtml.includes("data-sensitive-url"));
  assert.ok(plain.featuredHtml.includes('href="https://example.com"'));

  assert.ok(gated.featuredHtml.includes("featured-badge"));
  assert.ok(gated.featuredHtml.includes("data-sensitive-url"));
  assert.ok(!gated.featuredHtml.includes("href="), "gated card must not link out directly");
});

test("the view model builds canonical URLs and structured data", () => {
  const view = buildViewModel(PROFILES[DEFAULT_SLUG], { slug: "demo", path: "/demo" });
  assert.equal(view.canonical, `${SITE.origin}/demo`);
  const schema = JSON.parse(view.schema);
  assert.equal(schema["@type"], "Person");
  assert.equal(schema.url, view.canonical);
});

test("every profile is a valid, generated page and is listed in the sitemap", async () => {
  const sitemap = await read("sitemap.xml");
  assert.ok(sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<!-- generated by tools/build.mjs -->'));

  for (const [slug, profile] of Object.entries(PROFILES)) {
    assert.ok(profile.name, `${slug} needs a name`);
    assert.ok(LANGS.includes(normalizeLang(profile.lang)), `${slug} declares an unknown language`);
    assert.ok(await exists(`${slug}/index.html`), `${slug}/index.html is missing`);
    assert.ok(sitemap.includes(`<loc>${SITE.origin}/${slug}</loc>`), `${slug} is not in the sitemap`);

    const html = await read(`${slug}/index.html`);
    assert.ok(html.startsWith("<!-- generated by tools/build.mjs -->"), `${slug} page is not generated`);
    assert.ok(!html.includes("{{"), `${slug} page has unsubstituted tokens`);
    assert.ok(html.includes(`${SITE.origin}/${slug}"`), `${slug} page has no canonical URL`);

    const schema = JSON.parse(html.match(/id="profile-schema">(.*?)<\/script>/s)[1]);
    assert.equal(schema.name, profile.name);
  }
});

test("a page is served in the language of its profile", () => {
  assert.equal(normalizeLang("en"), "en");
  assert.equal(normalizeLang("en-GB"), "en");
  assert.equal(normalizeLang("ES"), "es");
  assert.equal(normalizeLang(""), FALLBACK_LANG);
  assert.equal(normalizeLang("de"), FALLBACK_LANG);

  const english = uiStrings("en", { name: "Nova", host: "example.com" });
  const spanish = uiStrings("es", { name: "Nova", host: "example.com" });
  assert.notEqual(english.ageTitle, spanish.ageTitle);
  assert.equal(english.avatarAlt, "Photo of Nova");
  assert.equal(spanish.avatarAlt, "Foto de Nova");
  assert.ok(english.ageCopy.includes(SITE.name) && spanish.ageCopy.includes(SITE.name));
});

test("generated pages carry the shell copy of their own language", async () => {
  for (const [slug, profile] of Object.entries(PROFILES)) {
    const html = await read(`${slug}/index.html`);
    const strings = uiStrings(profile.lang, { name: profile.name, host: new URL(SITE.origin).host });

    assert.ok(html.includes(`<html lang="${profile.lang}"`), `${slug} does not declare its language`);
    assert.ok(html.includes(escapeHtml(strings.shareLabel)), `${slug} has no share label`);
    assert.ok(html.includes(escapeHtml(strings.ageTitle)), `${slug} has no age-gate title`);
    assert.ok(html.includes(escapeHtml(strings.emptyTitleNotes)), `${slug} has no empty state title`);
    assert.ok(html.includes(escapeHtml(strings.footerNote)), `${slug} has no footer note`);
  }
});

test("the featured card uses the official OnlyFans mark", () => {
  const view = buildViewModel({
    ...MINIMAL,
    featuredLink: { title: "Exclusive content", note: "note", kind: "onlyfans", url: "https://onlyfans.com/x", image: "/assets/img/a.jpg" },
  }, { slug: "x" });

  assert.ok(view.featuredHtml.includes('fill="#00aeef"'), "the light blue of the mark is missing");
  assert.ok(view.featuredHtml.includes('fill="#008ccf"'), "the dark blue of the mark is missing");
  assert.ok(view.featuredHtml.includes('viewBox="-20.62 0.53 820.42 555.49"'), "the official viewBox is missing");
  assert.ok(!view.featuredHtml.includes("--icon-ink"), "the mark must not depend on the old placeholder colours");
});

test("the root page is the default profile and the 404 page is noindex", async () => {
  const root = await read("index.html");
  assert.ok(root.includes('data-profile-slug="' + DEFAULT_SLUG + '"'));
  assert.ok(root.includes(`<link rel="canonical" id="canonical-link" href="${SITE.origin}/"`));

  const fallback = await read("404.html");
  assert.ok(fallback.includes('content="noindex,follow"'));
});

test("gated cards keep usable button styles", async () => {
  const css = await read("src/styles.css");
  assert.ok(css.includes("button.featured-card"), "featured cards rendered as buttons need a reset");
  assert.ok(css.includes("button.link-card"), "link cards rendered as buttons need a reset");
});

test("the featured card hops on its own transform channel", async () => {
  const css = await read("src/styles.css");
  const keyframes = css.match(/@keyframes featured-hop \{([\s\S]*?)\n\}/);

  assert.ok(keyframes, "the hop keyframes are missing");
  assert.match(css, /\.featured-card \{[^}]*animation:[^;]*featured-hop/, "the featured card does not hop");
  assert.ok(keyframes[1].includes("translate:"), "the hop must actually move the card");
  assert.ok(!keyframes[1].includes("transform:"), "the hop must not fight the hover transform");
  assert.ok(css.includes("prefers-reduced-motion: reduce"), "reduced motion must stay honoured");
});
