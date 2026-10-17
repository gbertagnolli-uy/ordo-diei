/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["10.0.0.101", "10.0.0.*"],
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
