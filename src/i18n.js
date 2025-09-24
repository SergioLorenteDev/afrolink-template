/*
  Copy for the page shell: labels, tab names, the 18+ dialog and every other
  string that does not belong to a profile. A profile picks its language with
  `lang` (see data/profiles.js) and the build pre-renders the matching copy, so
  an English profile ships as real English HTML instead of being translated in
  the browser. Profile content (bio, notes, link titles) is never translated
  here: it is written by hand in the registry, in the profile's own language.
*/

import { SITE } from "./config.js";

export const FALLBACK_LANG = "es";

const COPY = {
  es: {
    shareLabel: "Compartir este perfil",
    shareTitle: (name) => `${name} · ${SITE.name}`,
    shareText: (name) => `Mira el perfil de ${name}`,
    shareCopied: "Enlace copiado al portapapeles.",
    verifiedLabel: "Perfil verificado",
    socialLabel: "Redes sociales",
    scrollCueLabel: "Deslizar hacia los enlaces",
    linksLabel: "Enlaces del perfil",
    updatesLabel: "Actualizaciones del perfil",
    sectionKicker: "Desde mi mundo",
    tabsLabel: "Contenido del perfil",
    tabNotes: "Notas",
    tabMedia: "Media",
    emptyTitleNotes: "Próximamente",
    emptyTitleMedia: "Sin media todavía",
    footerNote: (host) => `Perfil personal · ${host}`,
    ageCloseLabel: "Cerrar aviso",
    ageEyebrow: "Contenido sensible",
    ageTitle: "Este enlace es para mayores de 18",
    ageCopy: `Al continuar saldrás de ${SITE.name} y visitarás un sitio externo que puede incluir contenido para adultos.`,
    ageCancel: "Volver",
    ageContinue: "Continuar (18+)",
    avatarAlt: (name) => `Foto de ${name}`,
  },
  en: {
    shareLabel: "Share this profile",
    shareTitle: (name) => `${name} · ${SITE.name}`,
    shareText: (name) => `Check out ${name}'s profile`,
    shareCopied: "Link copied to the clipboard.",
    verifiedLabel: "Verified profile",
    socialLabel: "Social links",
    scrollCueLabel: "Scroll down to the links",
    linksLabel: "Profile links",
    updatesLabel: "Profile updates",
    sectionKicker: "From my world",
    tabsLabel: "Profile content",
    tabNotes: "Notes",
    tabMedia: "Media",
    emptyTitleNotes: "Coming soon",
    emptyTitleMedia: "No media yet",
    footerNote: (host) => `Personal profile · ${host}`,
    ageCloseLabel: "Close notice",
    ageEyebrow: "Sensitive content",
    ageTitle: "This link is for adults 18 and over",
    ageCopy: `By continuing you will leave ${SITE.name} and visit an external site that may include adult content.`,
    ageCancel: "Go back",
    ageContinue: "Continue (18+)",
    avatarAlt: (name) => `Photo of ${name}`,
  },
};

export const LANGS = Object.keys(COPY);

/* `en-GB` and `EN` both resolve to `en`; anything unknown falls back to `es`. */
export function normalizeLang(lang) {
  const code = String(lang === undefined || lang === null ? "" : lang).trim().toLowerCase().split("-")[0];
  return COPY[code] ? code : FALLBACK_LANG;
}

/*
  Flat, resolved strings: the build inlines them in the template and the browser
  reuses the very same values when it re-renders a page.
*/
export function uiStrings(lang, { name = "", host = "" } = {}) {
  const copy = COPY[normalizeLang(lang)];
  return {
    lang: normalizeLang(lang),
    avatarAlt: copy.avatarAlt(name),
    shareLabel: copy.shareLabel,
    shareTitle: copy.shareTitle(name),
    shareText: copy.shareText(name),
    shareCopied: copy.shareCopied,
    verifiedLabel: copy.verifiedLabel,
    socialLabel: copy.socialLabel,
    scrollCueLabel: copy.scrollCueLabel,
    linksLabel: copy.linksLabel,
    updatesLabel: copy.updatesLabel,
    sectionKicker: copy.sectionKicker,
    tabsLabel: copy.tabsLabel,
    tabNotes: copy.tabNotes,
    tabMedia: copy.tabMedia,
    emptyTitleNotes: copy.emptyTitleNotes,
    emptyTitleMedia: copy.emptyTitleMedia,
    footerNote: copy.footerNote(host),
    ageCloseLabel: copy.ageCloseLabel,
    ageEyebrow: copy.ageEyebrow,
    ageTitle: copy.ageTitle,
    ageCopy: copy.ageCopy,
    ageCancel: copy.ageCancel,
    ageContinue: copy.ageContinue,
  };
}
