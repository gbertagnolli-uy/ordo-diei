import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { gradoDe, imagenDeGrado } from "@/lib/cartas/fragmentos";
import { parsearGrado, rutaEnDiscoArte } from "@/lib/cartas/arte";
import { leerArchivo } from "@/lib/archivos";
import { TEXTOS_CARTAS } from "@/lib/cartas/textos";
import type { GradoCarta, RarezaCarta } from "@/lib/cartas/economia";

export const runtime = "nodejs";

const COLORES_MARCO: Record<
  RarezaCarta,
  {
    borde: string;
    bordeSecundario: string;
    fondoPie: string;
    textoPie: string;
    halo?: string;
  }
> = {
  Comun: {
    borde: "#78716c", // Stone 500
    bordeSecundario: "#44403c",
    fondoPie: "rgba(28, 25, 23, 0.92)",
    textoPie: "#e7e5e4",
  },
  Buena: {
    borde: "#059669", // Emerald 600
    bordeSecundario: "#047857",
    fondoPie: "rgba(6, 78, 59, 0.92)",
    textoPie: "#a7f3d0",
  },
  Perfecta: {
    borde: "#d97706", // Amber 600
    bordeSecundario: "#b45309",
    fondoPie: "rgba(69, 26, 3, 0.92)",
    textoPie: "#fef08a",
    halo: "rgba(245, 158, 11, 0.3)",
  },
  Celestial: {
    borde: "#38bdf8", // Sky 400
    bordeSecundario: "#0284c7",
    fondoPie: "rgba(12, 74, 110, 0.92)",
    textoPie: "#e0f2fe",
    halo: "rgba(56, 189, 248, 0.4)",
  },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clave: string }> }
) {
  try {
    const { clave } = await params;
    const searchParams = req.nextUrl.searchParams;
    const gradoPedido = parsearGrado(searchParams.get("grado")) as GradoCarta | null;
    if (gradoPedido === null) {
      return NextResponse.json({ error: "Grado no válido (0 a 4)" }, { status: 400 });
    }

    const carta = await prisma.carta.findUnique({
      where: { clave },
    });

    if (!carta || !carta.activa) {
      return new Response("Carta no encontrada", { status: 404 });
    }

    // Control de permisos: usuario común solo puede pedir hasta su grado actual (D9)
    const session = await getSession();
    const esAdmin =
      session?.user?.rolFamiliar === "Padre" || session?.user?.rolFamiliar === "Madre";

    if (!esAdmin) {
      const usuarioId = Number(session?.user?.id ?? 0);
      let gradoUsuario: GradoCarta = 0;

      if (usuarioId > 0) {
        const cu = await prisma.cartaUsuario.findUnique({
          where: { usuarioId_cartaId: { usuarioId, cartaId: carta.id } },
        });
        gradoUsuario = gradoDe(cu?.fragmentos ?? 0, carta.fragmentosRequeridos);
      }

      if (gradoPedido > gradoUsuario) {
        return NextResponse.json(
          { error: "No tenés permiso para acceder a la imagen de este grado" },
          { status: 403 }
        );
      }
    }

    // Determinar imagen del grado solicitado (D19)
    const imagenUrlRelativa = imagenDeGrado(
      {
        imagenUrl: carta.imagenUrl,
        imagenGrado2Url: carta.imagenGrado2Url,
        imagenGrado3Url: carta.imagenGrado3Url,
        imagenGrado4Url: carta.imagenGrado4Url,
      },
      gradoPedido
    );

    // next/og recibe la imagen como data URL: el arte no es público (D19)
    let imagenAbsoluta = imagenUrlRelativa;
    if (!imagenUrlRelativa.startsWith("http")) {
      // Catálogo: arte-cartas/ en disco. Subidas por el panel: tabla Archivos.
      const enDisco = rutaEnDiscoArte(imagenUrlRelativa);
      const archivo = enDisco
        ? await readFile(path.join(process.cwd(), enDisco)).catch(() => null)
        : (await leerArchivo(imagenUrlRelativa))?.datos ?? null;
      if (!archivo) return new Response("Imagen no encontrada", { status: 404 });
      // next/og (satori) no decodifica WebP, que es el formato del catálogo: se pasa a PNG
      const png = await sharp(archivo).png().toBuffer();
      imagenAbsoluta = `data:image/png;base64,${png.toString("base64")}`;
    }

    const estiloMarco = COLORES_MARCO[carta.rareza];
    const esBloqueada = gradoPedido === 0;
    const ancho = 378;
    const alto = 528; // Ratio 63:88 exacto

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0c0a09",
            padding: "16px",
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          {/* Marco exterior ornamental */}
          <div
            style={{
              position: "absolute",
              inset: "8px",
              border: `4px solid ${esBloqueada ? "#57534e" : estiloMarco.borde}`,
              borderRadius: "16px",
              boxShadow: estiloMarco.halo
                ? `0 0 24px ${estiloMarco.halo}, inset 0 0 16px ${estiloMarco.halo}`
                : undefined,
            }}
          />

          {/* Marco interior si Grado >= 2 */}
          {gradoPedido >= 2 && !esBloqueada && (
            <div
              style={{
                position: "absolute",
                inset: "14px",
                border: "2px solid #fbbf24",
                borderRadius: "12px",
                opacity: 0.85,
              }}
            />
          )}

          {/* Contenedor del arte */}
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              borderRadius: "10px",
              overflow: "hidden",
              position: "relative",
              backgroundColor: "#1c1917",
            }}
          >
            {/* Satori en next/og requiere elemento img estándar */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagenAbsoluta}
              alt={carta.nombre}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                // satori falla con propiedades de estilo en undefined: el filtro va solo si está bloqueada
                ...(esBloqueada ? { filter: "grayscale(100%) brightness(0.65)" } : {}),
              }}
            />

            {/* Insignia de Grado / Rareza superior */}
            <div
              style={{
                position: "absolute",
                top: "16px",
                left: "16px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                backgroundColor: "rgba(28, 25, 23, 0.85)",
                border: `1px solid ${esBloqueada ? "#78716c" : estiloMarco.borde}`,
                borderRadius: "6px",
                color: "#f5f5f4",
                fontSize: "13px",
                fontWeight: "bold",
                fontFamily: "serif",
              }}
            >
              {esBloqueada ? "BLOQUEADA" : TEXTOS_CARTAS.gradosRomanos[gradoPedido] || "I"}
            </div>

            <div
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                display: "flex",
                padding: "4px 10px",
                backgroundColor: "rgba(28, 25, 23, 0.85)",
                border: `1px solid ${esBloqueada ? "#78716c" : estiloMarco.borde}`,
                borderRadius: "6px",
                color: estiloMarco.textoPie,
                fontSize: "12px",
                fontWeight: "bold",
                letterSpacing: "1px",
              }}
            >
              {TEXTOS_CARTAS.rarezas[carta.rareza].toUpperCase()}
            </div>

            {/* Pie inferior con nombre de la carta */}
            <div
              style={{
                position: "absolute",
                bottom: "0px",
                left: "0px",
                right: "0px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 16px",
                backgroundColor: estiloMarco.fondoPie,
                borderTop: `2px solid ${esBloqueada ? "#57534e" : estiloMarco.bordeSecundario}`,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: "#fafaf9",
                  fontSize: "18px",
                  fontWeight: "bold",
                  fontFamily: "serif",
                  letterSpacing: "0.5px",
                }}
              >
                {carta.nombre}
              </div>
              {gradoPedido === 4 && (
                <div
                  style={{
                    color: "#fef08a",
                    fontSize: "12px",
                    fontFamily: "serif",
                    fontStyle: "italic",
                    marginTop: "2px",
                  }}
                >
                  Gloriosa
                </div>
              )}
            </div>
          </div>
        </div>
      ),
      {
        width: ancho,
        height: alto,
        headers: {
          // private: la respuesta depende del grado de quien pide; una CDN no debe compartirla (D19)
          "Cache-Control": "private, max-age=3600",
        },
      }
    );
  } catch (error) {
    console.error("[API/Cartas/Imagen] GET:", error);
    return new Response("Error al componer imagen", { status: 500 });
  }
}
