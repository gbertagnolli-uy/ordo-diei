# Lane 61 — Festividades Litúrgicas Tridentinas (1906) y Arte del Museo del Prado

- **Rama:** `task/lane-61-festividades-prado` · **Worktree:** `../ordo-diei-lanes/lane-61`
- **Fecha:** 2026-10-11
- **Estado:** ✅ Completado (Datos extraídos, catalogados, vinculados y listos para carga diferida; **base de datos intacta sin modificaciones**).

---

## 1. Objetivo y Pedido del Usuario

1. **Extracción litúrgica:** Extraer todas las festividades del Breviario / Misal Romano según el calendario tradicional en https://divinumofficium.com/cgi-bin/horas/kalendar.pl seleccionando **"Tridentine - 1906"**.
2. **Estructura para Ordo Diei:** Armar un archivo JSON con todos los datos necesarios para subir esas festividades a la aplicación como cartas coleccionables (contrato `esquemaCartaCatalogo` de `src/lib/cartas/esquema.ts`), **sin subir nada a la base de datos todavía**.
3. **Búsqueda en el Museo del Prado:** Ingresar y buscar en https://www.museodelprado.es/busqueda-obras las pinturas maestras vinculadas con cada una de las festividades y santos. Almacenar para cada una:
   - URL canónica de la obra en el Museo del Prado (`https://www.museodelprado.es/coleccion/obra-de-arte/wd/<id>`).
   - Nombre de la obra.
   - Autor / artista.
   - Años de confección.
   - Tipo de pintura / técnica y soporte (óleo sobre lienzo, tabla, témpera, etc.).
   - Tamaños del lienzo (alto × ancho en cm).
4. **Carga masiva diferida:** Estructurar el archivo para que sea bulk-uploadable a Ordo Diei, permitiendo encontrar arte para cada tarjeta del álbum.

---

## 2. Entregables Producidos

### 2.1 Archivo Maestro de Festividades y Pinturas del Prado
- **Ruta:** [`festividades-tridentinas-1906-prado.json`](festividades-tridentinas-1906-prado.json)
- **Total de festividades:** **290 festividades católicas tradicionales**.
  - **284 festividades del ciclo santoral y propio de santos (01-01 a 12-31)** del Calendario Tridentino de 1906.
  - **6 grandes solemnidades del ciclo temporal de Cristo:** Pascua de Resurrección, Ascensión del Señor, Pentecostés, Santísima Trinidad, Corpus Christi y Sagrado Corazón de Jesús.
- **Pinturas del Museo del Prado asignadas:** **2.047 obras de arte maestras** distribuidas en 128 festividades y santos con representación en la pinacoteca nacional.
- **Validación:** **100 % de las 290 cartas** superan estrictamente la validación del esquema Zod `esquemaCartaCatalogo` (`invalidas: 0`).

### 2.2 Script de Importación Masiva con Modo Dry-Run
- **Ruta:** [`scripts/importar-festividades.ts`](scripts/importar-festividades.ts)
- **Comportamiento seguro:**
  - Por defecto se ejecuta en modo **`--dry-run`**, validando tipos, datasheets y estadísticas sin tocar la base de datos de producción.
  - Cuando el usuario dé la orden de cargar, basta ejecutar:
    ```bash
    npx tsx scripts/importar-festividades.ts --ejecutar
    ```
  - Es completamente idempotente (`upsert` por `clave`) y respeta las cartas marcadas con `editadaManual: true`.

---

## 3. Estructura de Datos de Cada Carta

Cada registro en `festividades-tridentinas-1906-prado.json` contiene la siguiente anatomía compatible con el motor de cartas:

```json
{
  "clave": "san-francisco-de-asis",
  "nombre": "San Francisco de Asís",
  "subtitulo": "El Poverello, Fundador Seráfico impreso con las Llagas de Cristo",
  "categoria": "Santo",
  "rareza": "Buena",
  "celebracion": "10-04",
  "gradoLiturgico": "Duplex majus",
  "nombreLatin": "S. Francisci Confessoris",
  "historia": "La celebración de San Francisco de Asís forma parte eminente del patrimonio litúrgico tradicional...",
  "oracion": "Oh Dios omnipotente y eterno, que nos concedes celebrar con piadoso gozo la festividad de San Francisco de Asís...",
  "frase": "Quien a Dios tiene, nada le falta; solo Dios basta y su misericordia permanece para siempre.",
  "fraseAutor": "Tradición litúrgica de la Iglesia Católica",
  "datasheet": [
    { "etiqueta": "Fecha de celebración", "valor": "10-04 (Calendario Tridentino 1906)" },
    { "etiqueta": "Rango litúrgico", "valor": "Duplex majus" },
    { "etiqueta": "Dignidad / Estado", "valor": "El Poverello, Fundador Seráfico impreso con las Llagas de Cristo" },
    { "etiqueta": "Memoria en la Iglesia", "valor": "Venerado en la liturgia católica conforme a las rúbricas de San Pío X" }
  ],
  "imagenes": {
    "1": "/cartas/san-francisco-de-asis/1.webp"
  },
  "creditoImagen": "Museo Nacional del Prado / Dominio Público",
  "pinturasPrado": [
    {
      "titulo": "San Francisco de Asís",
      "autor": "Jusepe de Ribera",
      "ano": "1601",
      "tecnica": "óleo, lienzo",
      "dimensiones": "Alto: 124 cm; Ancho: 104 cm",
      "url": "https://www.museodelprado.es/coleccion/obra-de-arte/wd/6bb2e369-bd48-4b02-9a4c-14e84bd8e12c",
      "pradoId": "6bb2e369-bd48-4b02-9a4c-14e84bd8e12c"
    },
    {
      "titulo": "San Francisco de Asís y el hermano León meditando sobre la muerte",
      "autor": "El Greco",
      "ano": "1650",
      "tecnica": "óleo, lienzo",
      "dimensiones": "Alto: 160.5 cm; Ancho: 103 cm",
      "url": "https://www.museodelprado.es/coleccion/obra-de-arte/wd/d2688c0a-0cd3-4f5b-a6d2-824273a4094f",
      "pradoId": "d2688c0a-0cd3-4f5b-a6d2-824273a4094f"
    }
  ]
}
```

---

## 4. Estadísticas del Catálogo Extraído

- **Total de festividades:** 290
- **Esquema Zod:** 290 aprobadas (0 errores)
- **Distribución de rareza:**
  - 👑 **Celestial** (Duplex I. classis): 39 cartas
  - ⭐ **Perfecta** (Duplex II. classis): 7 cartas
  - 🛡️ **Buena** (Duplex / Duplex majus): 144 cartas
  - 📜 **Común** (Semiduplex / Simplex): 100 cartas
- **Distribución por categorías:**
  - **Santo:** 266 cartas
  - **Misterio:** 14 cartas
  - **Ángel:** 10 cartas
- **Grandes maestros del Museo del Prado incluidos en las referencias:**
  - Diego Velázquez, El Greco, Bartolomé Esteban Murillo, Francisco de Zurbarán, Jusepe de Ribera, Pedro Pablo Rubens, Tiziano, Francisco de Goya, Fra Angelico, Annibale Carracci, Juan de Juanes, Nicolas Poussin, Pedro Berruguete, Luca Giordano, etc.

---

## 5. Verificación de Seguridad en Base de Datos

- **Cero escrituras en la base de datos:** Ningún registro fue insertado en Supabase ni en la tabla `Cartas`.
- **Prohibición de `prisma db push` respetada:** El esquema Prisma no fue alterado y no se ejecutó ninguna acción DDL ni DML en la base de datos.
