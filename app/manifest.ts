import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Journal",
    short_name: "Journal",
    description: "Encrypted personal journal",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // display_override gives Android 12+ the best fullscreen TWA behavior
    display_override: ["window-controls-overlay", "standalone"],
    orientation: "portrait",
    background_color: "#f8f7f2",
    theme_color: "#f8f7f2",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
