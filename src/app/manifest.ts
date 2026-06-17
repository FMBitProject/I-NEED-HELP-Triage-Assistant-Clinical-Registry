import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "I-NEED-HELP Triage Assistant",
    short_name: "I-NEED-HELP",
    description: "Sistem Triase & Registri Klinis Gagal Jantung – PERKI Guidelines",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#1d4ed8",
    categories: ["medical", "health"],
    icons: [
      {
        src: "/pwa-icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/pwa-icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
