/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["10.0.0.101", "10.0.0.*"],
  // El arte de las cartas vive fuera de public/ (D19) y lo leen estas rutas desde el disco
  outputFileTracingIncludes: {
    "/api/cartas/arte": ["./arte-cartas/**/*"],
    "/api/cartas/\\[clave\\]/imagen": ["./arte-cartas/**/*"],
  },
};

export default nextConfig;
