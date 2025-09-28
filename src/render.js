/*
  View model for a profile. Pure data in, strings out: the build script uses it
  to pre-render the static pages and the browser uses it to re-render a page
  when the URL and the pre-rendered profile do not match. Both consume exactly
  the same markup, so there is a single source of truth.
*/

import { SITE } from "./config.js";
import { icon } from "./icons.js";
import { uiStrings } from "./i18n.js";
import { escapeHtml, safeUrl, absoluteUrl, resolveBlur, toText } from "./utils.js";

function cssUrl(path) {
  const url = safeUrl(path);
  if (!url) return "none";
  return `url("${url.replace(/["'()\\\s]/g, (character) => encodeURIComponent(character))}")`;
}

function renderSocial(social = []) {
  return social
    .map((item) => ({ ...item, url: safeUrl(item.url) }))
    .filter((item) => item.url)
    .map((item) => `<a class="social-button social-button--${escapeHtml(item.kind)}" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(item.label)}">${icon(item.kind)}</a>`)
    .join("");
}

/*
  Sensitive cards are rendered as <button> on purpose: an <a href> can be
  opened in a new tab or via the context menu, which would bypass the 18+ gate.
*/
function renderFeatured(featured) {
  if (!featured || !safeUrl(featured.url)) return "";
  const url = safeUrl(featured.url);
  /* cssUrl() emits quotes, so it has to be attribute-escaped before inlining. */
  const image = escapeHtml(cssUrl(featured.image));
  const label = `${toText(featured.title)}, ${toText(featured.note)}`;
  const badge = featured.sensitive ? '<span class="featured-badge">18+</span>' : "";
  const tag = featured.sensitive ? "button" : "a";
  const attributes = featured.sensitive
    ? `type="button" data-sensitive-url="${escapeHtml(url)}"`
    : `href="${escapeHtml(url)}"`;
  return `
      <${tag} class="featured-card" id="featured-card" ${attributes} style="--featured-image:${image}" aria-label="${escapeHtml(label)}">
        <span class="featured-shade" aria-hidden="true"></span>
        <span class="featured-topline">${badge}<span class="featured-arrow" aria-hidden="true">↗</span></span>
        <span class="featured-copy">
          <span class="featured-logo" aria-hidden="true">${icon(featured.kind)}</span>
          <span class="featured-text">
            <strong>${escapeHtml(featured.title)}</strong>
            <small>${escapeHtml(featured.note)}</small>
          </span>
        </span>
      </${tag}>`;
}

function renderLinks(links = []) {
  return links
    .map((link, index) => ({ ...link, url: safeUrl(link.url) }))
    .filter((link) => link.url)
    .map((link, index) => {
      const media = link.image
        ? `<img class="link-image" src="${escapeHtml(safeUrl(link.image))}" alt="" loading="lazy" decoding="async" />`
        : `<span class="link-icon link-icon--${escapeHtml(link.kind)}">${icon(link.kind)}</span>`;
      const tag = link.sensitive ? "button" : "a";
      const attributes = link.sensitive
        ? `type="button" data-sensitive-url="${escapeHtml(link.url)}"`
        : `href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer"`;
      return `
      <${tag} class="link-card" ${attributes} style="--link-index:${index}">
        ${media}
        <span class="link-copy">
          <strong>${escapeHtml(link.title)}</strong>
          ${link.note ? `<small>${escapeHtml(link.note)}</small>` : ""}
        </span>
        <span class="link-arrow" aria-hidden="true">↗</span>
      </${tag}>`;
    })
    .join("");
}

export function buildViewModel(profile, options = {}) {
  const origin = options.origin || SITE.origin;
  const path = options.path || (options.slug ? `/${options.slug}` : "/");
  const canonical = new URL(path, origin).href;
  const name = toText(profile.name);
  const description = toText(profile.seoDescription || profile.bio);
  const title = `${name} · ${SITE.name}`;
  const strings = uiStrings(profile.lang, { name, host: new URL(origin).host });
  const shareImage = absoluteUrl(profile.background, origin);
  const avatar = safeUrl(profile.avatar);
  const location = toText(profile.location);
  const bio = toText(profile.bio);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    alternateName: toText(profile.handle),
    description,
    url: canonical,
    image: absoluteUrl(avatar, origin),
    sameAs: (profile.social || [])
      .filter((item) => item.seo !== false)
      .map((item) => safeUrl(item.url))
      .filter(Boolean),
  };

  return {
    slug: options.slug || "",
    lang: profile.lang || SITE.defaultLang,
    robots: options.robots || "index,follow",
    themeColor: profile.themeColor || SITE.themeColor,
    title,
    description,
    canonical,
    shareImage,
    schema: JSON.stringify(schema),
    themeStyle: `:root{--accent:${profile.accent || "#d9ff55"};--accent-deep:${profile.accentDeep || "#7d9d1b"};--hero-position:${profile.backgroundPosition || "center"};--profile-background:${cssUrl(profile.background)};--profile-background-blur:${resolveBlur(profile.backgroundBlur)}}`,
    name,
    handle: toText(profile.handle),
    avatar,
    avatarAlt: strings.avatarAlt,
    strings,
    location,
    locationHidden: location ? "" : " hidden",
    bio,
    bioHidden: bio ? "" : " hidden",
    socialHtml: renderSocial(profile.social),
    featuredHtml: renderFeatured(profile.featuredLink),
    linksHtml: renderLinks(profile.links),
    emptyNotes: toText(profile.emptyNotes),
    emptyMedia: toText(profile.emptyMedia),
  };
}

export function applyViewModel(view, doc = document) {
  const set = (selector, value) => {
    const node = doc.querySelector(selector);
    if (node) node.textContent = value;
  };
  const attribute = (selector, name, value) => {
    const node = doc.querySelector(selector);
    if (node) node.setAttribute(name, value);
  };
  const setHidden = (selector, hidden) => {
    const node = doc.querySelector(selector);
    if (node) node.hidden = hidden;
  };

  /* Views built elsewhere may only carry the profile: fall back to its language. */
  const strings = view.strings || uiStrings(view.lang, { name: view.name });

  doc.title = view.title;
  doc.documentElement.lang = view.lang;
  set("#theme-style", view.themeStyle);
  set("#sticky-name", view.name);
  set("#profile-name", view.name);
  set("#profile-handle", view.handle);
  set("#profile-location", view.location);
  set("#profile-bio", view.bio);
  setHidden("#profile-location", Boolean(view.locationHidden));
  setHidden("#profile-bio", Boolean(view.bioHidden));
  set("#empty-copy", view.emptyNotes);

  /* The shell copy travels with the profile, so a re-rendered page keeps its language. */
  attribute("#share-button", "aria-label", strings.shareLabel);
  attribute("#hero-share-button", "aria-label", strings.shareLabel);
  attribute(".verified", "aria-label", strings.verifiedLabel);
  attribute("#social-row", "aria-label", strings.socialLabel);
  attribute("#scroll-cue", "aria-label", strings.scrollCueLabel);
  attribute("#link-section", "aria-label", strings.linksLabel);
  attribute("#updates-section", "aria-label", strings.updatesLabel);
  attribute("#tabs", "aria-label", strings.tabsLabel);
  attribute("#age-close", "aria-label", strings.ageCloseLabel);
  set("#section-kicker", strings.sectionKicker);
  set("#tab-notes", strings.tabNotes);
  set("#tab-media", strings.tabMedia);
  set("#empty-title", strings.emptyTitleNotes);
  set("#footer-note", strings.footerNote);
  set("#age-eyebrow", strings.ageEyebrow);
  set("#age-title", strings.ageTitle);
  set("#age-copy", strings.ageCopy);
  set("#age-cancel", strings.ageCancel);
  set("#age-continue-label", strings.ageContinue);

  for (const [selector, source] of [["#sticky-avatar", view.avatar], ["#profile-avatar", view.avatar]]) {
    const node = doc.querySelector(selector);
    if (node) {
      node.setAttribute("src", source);
      node.setAttribute("alt", view.avatarAlt);
    }
  }

  const fill = (selector, html) => {
    const node = doc.querySelector(selector);
    if (node) node.innerHTML = html;
  };
  fill("#social-row", view.socialHtml);
  fill("#featured-slot", view.featuredHtml);
  fill("#links-list", view.linksHtml);

  attribute('meta[name="description"]', "content", view.description);
  attribute('meta[property="og:title"]', "content", view.title);
  attribute('meta[property="og:description"]', "content", view.description);
  attribute('meta[property="og:url"]', "content", view.canonical);
  attribute('meta[property="og:image"]', "content", view.shareImage);
  attribute('meta[name="twitter:title"]', "content", view.title);
  attribute('meta[name="twitter:description"]', "content", view.description);
  attribute('meta[name="twitter:image"]', "content", view.shareImage);
  attribute('meta[name="robots"]', "content", view.robots);
  attribute('meta[name="theme-color"]', "content", view.themeColor);
  attribute("#canonical-link", "href", view.canonical);
  set("#profile-schema", view.schema);
}
