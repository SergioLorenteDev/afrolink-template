/*
  AfroLink profile registry.

  Every public profile lives here, keyed by the slug used in the URL
  (`example.com/luna` -> key `luna`). Images can be absolute URLs or local
  paths such as "/assets/img/demo-avatar.jpg".

  The profile shipped here is fictional: it only exists to demo the project.

  `tools/build.mjs` reads this file to pre-render the static pages, and the
  browser imports it as the temporary stand-in for the future API.
*/

export const DEFAULT_SLUG = "luna";

export const PROFILES = {
  luna: {
    name: "Luna Reyes",
    handle: "@luna.reyes",
    lang: "es",
    location: "Madrid, España",
    bio: "DJ y creadora. Sets en directo, mezclas y contenido exclusivo.",
    seoDescription: "Todos los enlaces de Luna Reyes: música, fechas y contenido exclusivo.",
    avatar: "/assets/img/demo-avatar.jpg",
    background: "/assets/img/demo-bg.jpg",
    backgroundBlur: "18%",
    backgroundPosition: "center 40%",
    accent: "#d9ff55",
    accentDeep: "#7d9d1b",
    social: [
      { label: "Spotify", kind: "spotify", url: "https://open.spotify.com/" },
      { label: "YouTube", kind: "youtube", url: "https://youtube.com/" },
      { label: "Instagram", kind: "instagram", url: "https://instagram.com/" },
    ],
    featuredLink: {
      title: "Contenido exclusivo",
      note: "Acceso privado para miembros",
      kind: "onlyfans",
      sensitive: true,
      image: "/assets/img/demo-featured.jpg",
      url: "https://onlyfans.com/",
    },
    links: [
      { title: "Última mezcla", note: "Sesión de 60 minutos en directo", kind: "music", url: "https://soundcloud.com/" },
      { title: "Próximo show", note: "Sábado 21:00 · Madrid", kind: "ticket", url: "https://example.com/entradas" },
      { title: "Newsletter", note: "Una vez al mes, sin spam", kind: "mail", url: "mailto:hola@example.com" },
    ],
    emptyNotes: "Las notas de Luna aparecerán aquí.",
    emptyMedia: "Las fotos y vídeos de Luna aparecerán aquí.",
  },
};
