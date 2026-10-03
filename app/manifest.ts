import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VeloQuest",
    short_name: "VeloQuest",
    description: "Ton programme vélo, tes quêtes, ta progression.",
    start_url: "/",
    display: "standalone",
    background_color: "#070a13",
    theme_color: "#0c1020",
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
    ]
  };
}
