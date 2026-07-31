import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Taaruf Management System",
    short_name: "TMS",
    description: "Sistem Manajemen Taaruf RPL SMKN 1 Cimahi",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0284c7",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
