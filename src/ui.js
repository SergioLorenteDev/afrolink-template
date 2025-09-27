/* DOM interactions: sharing, the 18+ gate, the tabs and the sticky header. */

import { uiStrings } from "./i18n.js";

let pendingSensitiveUrl = "";

export function showToast(message, doc = document) {
  const toast = doc.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove("is-visible"), 3000);
}

export function shareProfile(profile) {
  const strings = uiStrings(profile.lang, { name: profile.name });
  const data = {
    title: strings.shareTitle,
    text: strings.shareText,
    url: window.location.href,
  };
  if (navigator.share) {
    navigator.share(data).catch(() => {});
    return;
  }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast(strings.shareCopied))
      .catch(() => showToast(window.location.href));
    return;
  }
  showToast(window.location.href);
}

export function openAgeGate(url, doc = document) {
  pendingSensitiveUrl = url;
  const gate = doc.querySelector("#age-gate");
  gate.hidden = false;
  doc.body.classList.add("age-gate-open");
  const confirm = doc.querySelector("#age-continue");
  if (confirm) confirm.focus();
}

export function closeAgeGate(doc = document) {
  const gate = doc.querySelector("#age-gate");
  gate.hidden = true;
  doc.body.classList.remove("age-gate-open");
  pendingSensitiveUrl = "";
}

function bindTabs(doc, profile) {
  const strings = uiStrings(profile.lang, { name: profile.name });
  const emptyTitle = doc.querySelector("#empty-title");
  const emptyCopy = doc.querySelector("#empty-copy");
  doc.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      doc.querySelectorAll(".tab").forEach((other) => {
        const isActive = other === tab;
        other.classList.toggle("is-active", isActive);
        other.setAttribute("aria-selected", String(isActive));
      });
      const isMedia = tab.dataset.tab === "media";
      if (emptyTitle) emptyTitle.textContent = isMedia ? strings.emptyTitleMedia : strings.emptyTitleNotes;
      if (emptyCopy) emptyCopy.textContent = isMedia ? (profile.emptyMedia || "") : (profile.emptyNotes || "");
    });
  });
}

function bindStickyHeader(doc) {
  const header = doc.querySelector("#sticky-header");
  const hero = doc.querySelector("#hero");
  if (!header || !hero || typeof IntersectionObserver === "undefined") return;
  const observer = new IntersectionObserver(([entry]) => {
    header.classList.toggle("is-visible", !entry.isIntersecting);
  }, { threshold: 0.12 });
  observer.observe(hero);
}

export function bindInteractions(profile, doc = document) {
  const share = () => shareProfile(profile);
  doc.querySelector("#share-button")?.addEventListener("click", share);
  doc.querySelector("#hero-share-button")?.addEventListener("click", share);
  doc.querySelector("#scroll-cue")?.addEventListener("click", () => {
    doc.querySelector("#link-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /*
    Every sensitive card is a <button data-sensitive-url>, never a link, so the
    only way out is through the dialog.
  */
  doc.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-sensitive-url]");
    if (!trigger) return;
    event.preventDefault();
    openAgeGate(trigger.dataset.sensitiveUrl, doc);
  });

  doc.querySelector("#age-close")?.addEventListener("click", () => closeAgeGate(doc));
  doc.querySelector("#age-cancel")?.addEventListener("click", () => closeAgeGate(doc));
  doc.querySelectorAll("[data-age-close]").forEach((element) => element.addEventListener("click", () => closeAgeGate(doc)));
  doc.querySelector("#age-continue")?.addEventListener("click", () => {
    if (pendingSensitiveUrl) window.location.assign(pendingSensitiveUrl);
  });
  doc.addEventListener("keydown", (event) => {
    const gate = doc.querySelector("#age-gate");
    if (event.key === "Escape" && gate && !gate.hidden) closeAgeGate(doc);
  });

  bindTabs(doc, profile);
  bindStickyHeader(doc);
}
