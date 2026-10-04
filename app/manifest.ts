import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "VeloQuest",
    short_name: "VeloQuest",
    description: "Ton programme vélo, tes quêtes, ta progression.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#070a13",
    theme_color: "#0c1020",
    orientation: "any",
    categories: ["fitness", "health", "sports"],
    shortcuts: [
      { name: "Choisir une séance", short_name: "Séances", url: "/?tab=sessions", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] },
      { name: "Cols & parcours", short_name: "Parcours", url: "/?tab=climbs", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] },
      { name: "Voir ma progression", short_name: "Suivi", url: "/?tab=progress", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] }
    ],
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
    ]
  };
}
