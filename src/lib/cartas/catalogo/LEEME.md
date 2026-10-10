# Convención de Arte e Imágenes de Cartas Católicas (Ordo Diei)

## 1. Estructura de Directorios y Archivos

Cada carta del catálogo cuenta con una carpeta propia dentro de `arte-cartas/` (fuera de `public/` a propósito: el arte se sirve solo por `/api/cartas/arte`, que respeta el grado del usuario, D19) identificada unívocamente por su `clave` (slug en minúsculas):

```
arte-cartas/<clave>/
  ├── 1.webp   (Grado I  - Revelado básico / inicial)
  ├── 2.webp   (Grado II - Revelado intermedio)
  ├── 3.webp   (Grado III - Revelado avanzado)
  └── 4.webp   (Grado IV - Revelado pleno / Holo dorado)
```

## 2. Especificaciones Técnicas del Arte

- **Proporción de aspecto:** Retrato estándar de naipes coleccionables: **63:88** (equivalente a 630 × 880 píxeles o superior en la misma relación).
- **Formato:** `.webp` con compresión de calidad visual superior (80-90%).
- **Peso por archivo:** **≤ 300 KB** por cada imagen.
- **Encuadre y composición:** Debe conservarse el mismo encuadre general del santo o misterio a lo largo de los cuatro grados para permitir una progresión armónica (desde arte sobrio en Grado I hasta mayor resplandor, aureola o detalles celestiales en los Grados superiores).

## 3. Comportamiento en Caso de Imágenes Faltantes (Fallback)

1. El Grado I (`1.webp`) es obligatorio para toda carta activa.
2. Si un grado superior (`2.webp`, `3.webp`, `4.webp`) no ha sido provisto aún por el usuario o administrador, la base de datos almacena `null` en dicho campo.
3. El componente de visualización `CartaVista.tsx` y el motor de renderizado aplican automáticamente fallback en cascada, mostrando el arte del grado inmediato anterior disponible (por ejemplo, si falta el Grado III, se muestra el Grado II).

## 4. Carga y Reemplazo

El usuario puede:
- Copiar directamente sus archivos definitivos a `arte-cartas/<clave>/{1,2,3,4}.webp`.
- O bien subirlos desde el panel administrativo de cartas en `/dashboard/cartas/admin` (Lane 36), el cual gestiona la subida y vista previa inmediata.
