/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["10.0.0.101", "10.0.0.*"],
  experimental: {
    optimizePackageImports: [
      "@hugeicons/core-free-icons",
      "@hugeicons/react",
      "@mantine/core",
      "@mantine/hooks",
      "radix-ui",
      "framer-motion",
    ],
  },
  async headers() {
    const cacheEstatica = [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }];
    return [
      { source: "/companeros/:path*", headers: cacheEstatica },
      { source: "/habitos/:path*", headers: cacheEstatica },
      { source: "/niveles/:path*", headers: cacheEstatica },
      { source: "/premios/:path*", headers: cacheEstatica },
      { source: "/models/:path*", headers: cacheEstatica },
    ];
  },
  // El arte de las cartas vive fuera de public/ (D19) y lo leen estas rutas desde el disco
  outputFileTracingIncludes: {
    "/api/cartas/arte": ["./arte-cartas/**/*"],
    "/api/cartas/\\[clave\\]/imagen": ["./arte-cartas/**/*"],
    // sharp: el trazado no copia la libvips nativa y en Vercel falla con ERR_DLOPEN_FAILED (libvips-cpp.so)
    "/*": [
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
  },
};

export default nextConfig;
