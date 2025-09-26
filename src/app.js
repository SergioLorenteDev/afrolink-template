/*
  Entry point. Pages are pre-rendered by tools/build.mjs, so this file only
  re-renders when the URL asks for a profile other than the one baked into the
  HTML (the `?profile=` variant and the 404 fallback) and then wires the UI.
*/

import { PROFILES, DEFAULT_SLUG } from "../data/profiles.js";
import { buildViewModel, applyViewModel } from "./render.js";
import { bindInteractions } from "./ui.js";

export function getProfileSlug() {
  const queryProfile = new URLSearchParams(window.location.search).get("profile");
  const firstSegment = window.location.pathname.split("/").filter(Boolean)[0] || "";
  const pathProfile = firstSegment === "index.html" ? "" : firstSegment;
  return (queryProfile || pathProfile || DEFAULT_SLUG).toLowerCase();
}

/*
  Data layer. Today profiles come from the registry in /data/profiles.js;
  when the backend exists this is the only function that has to change:

    export async function loadProfile(slug) {
      const response = await fetch(`/api/profiles/${encodeURIComponent(slug)}`);
      return response.ok ? response.json() : null;
    }
*/
export async function loadProfile(slug) {
  return PROFILES[slug] || null;
}

export function setRobots(content, doc = document) {
  const meta = doc.querySelector('meta[name="robots"]');
  if (meta) meta.setAttribute("content", content);
}

async function start(doc = document) {
  const slug = getProfileSlug();
  const preRendered = doc.documentElement.dataset.profileSlug || "";
  const profile = await loadProfile(slug);

  /*
    Unknown slug: the default profile stays on screen as a visual fallback, but
    it must never be indexed as a page of its own (duplicate content).
  */
  if (!profile) {
    setRobots("noindex,follow", doc);
    bindInteractions(PROFILES[DEFAULT_SLUG] || {}, doc);
    return;
  }

  if (slug !== preRendered) {
    applyViewModel(buildViewModel(profile, { slug, path: `/${slug}` }), doc);
  }

  bindInteractions(profile, doc);
}

if (typeof document !== "undefined") start();
