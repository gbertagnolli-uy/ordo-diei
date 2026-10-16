import type { MetadataRoute } from "next";

// App instalable (lane 204): con la app en la pantalla de inicio llegan los avisos del celular.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ordo Diei",
    short_name: "Ordo Diei",
    description: "Sancta rutina diei ad animam fovendam et Deum laudandum.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#FBF9F5",
    theme_color: "#502300",
    lang: "es",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
