import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MF Compass",
    short_name: "MFC",
    description: "Identify Indian mutual funds that consistently outperform their peers.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#2f62fd",
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
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
