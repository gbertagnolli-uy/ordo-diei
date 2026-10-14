# Lane H5 — Compliance Legal, Créditos Carnegie y Transcripts PDF

> **Estado:** Lista para ejecución cuando H3 y H4 estén integradas en `dev`.  
> **Dependencias:** Lane H3 (Portafolio) y Lane H4 (Calificaciones y Horas).  
> **Tamaño:** M (Modelado legal + Activity Journal + Generador de PDF oficial).

---

## 1. Objetivo de la Lane

Construir el **foso defensivo legal (Compliance Moat)** para las familias homeschoolers: mapear los requisitos regulatorios por estado o país (horas anuales obligatorias, materias mínimas), habilitar el **Activity Journal** para justificar horas no lectivas fuera de pantalla (museos, laboratorios, deportes), computar automáticamente los **Créditos Carnegie** y el GPA, y generar con 1 clic un **High School Transcript** y un **Portafolio Anual** en formato PDF oficial para presentar ante inspectores o universidades.

---

## 2. Activity Journal (Registro de Horas Offline)

- **Ubicación UI:** `/dashboard/homeschooling/horas-offline`
- **Mecánica:**
  - Formulario ágil para registrar actividades formativas del mundo real.
  - Campos:
    - Alumno y Materia (ej. "Ciencias Naturales").
    - Título: *"Excursión botánica y recolección de muestras"*.
    - Duración: selector de horas/minutos o uso del cronómetro integrado de Ordo Diei.
    - Foto comprobante (opcional, subida a `Archivo`).
  - Cada entrada suma minutos lectivos a la cuenta legal de la materia.

---

## 3. Mapeo de Leyes y Alertas de Cumplimiento

- **Ubicación:** `src/lib/homeschooling/compliance.ts`
- **Catálogo de Jurisdicciones:**
  ```typescript
  export interface ReglasEstado {
    codigo: string;
    nombre: string;
    horasAnualesTotales: number;
    horasMinimasPorMateria?: Record<string, number>;
    requierePortafolio: boolean;
    requiereEvaluacionAnual: boolean;
    diasMinimos?: number;
  }

  export const JURISDICCIONES: Record<string, ReglasEstado> = {
    NY: { codigo: 'NY', nombre: 'Nueva York', horasAnualesTotales: 900, requierePortafolio: true, requiereEvaluacionAnual: true },
    TX: { codigo: 'TX', nombre: 'Texas', horasAnualesTotales: 0, requierePortafolio: false, requiereEvaluacionAnual: false },
    FL: { codigo: 'FL', nombre: 'Florida', horasAnualesTotales: 720, requierePortafolio: true, requiereEvaluacionAnual: true },
    UY: { codigo: 'UY', nombre: 'Uruguay', horasAnualesTotales: 800, requierePortafolio: true, requiereEvaluacionAnual: false }
  };
  ```
- **Alertas Proactivas en el Dashboard del Padre:**
  - *"Atención: Faltan 14 horas de Ciencias este mes para cumplir con la meta de Nueva York"*.
  - Barra de progreso legal del ciclo escolar: `Horas acumuladas vs. Horas exigidas`.

---

## 4. Cálculo de Créditos Carnegie y GPA

- **Fórmula de Créditos Carnegie (Estándar Universitario EE.UU.):**
  - $120$ horas de instrucción en aula = $1.0$ Crédito Carnegie.
  - $60$ horas = $0.5$ Créditos (semestral).
  - En asignaturas de laboratorio (Física/Química) se computan $150$ horas por crédito.
  ```typescript
  export function calcularCreditos(minutosTotales: number): number {
    const horas = minutosTotales / 60;
    return Math.floor((horas / 60)) * 0.5; // Escala en saltos de 0.5 créditos
  }
  ```
- **Cálculo de GPA Ponderado (Escala 4.0):**
  - $\ge 90\% \rightarrow A (4.0)$
  - $80 - 89\% \rightarrow B (3.0)$
  - $70 - 79\% \rightarrow C (2.0)$
  - GPA acumulado ponderado por los créditos de cada materia.

---

## 5. Generador de Documentos Oficiales en PDF

- **Rutas de Exportación:**
  1. `/dashboard/homeschooling/reportes/transcript` (Expediente de Secundaria / High School Transcript).
  2. `/dashboard/homeschooling/reportes/portafolio-anual` (Dossier con fotos de evidencias destacadas).
- **Estructura del Transcript Oficial:**
  - Encabezado: Nombre de la escuela en casa / Familia, datos del alumno, fecha de nacimiento, ciclo lectivo.
  - Tabla académica:
    - Nombre del curso (ej. *"Álgebra I"*, *"Historia Universal"*, *"Biología con Laboratorio"*).
    - Horas lectivas acreditadas (online + offline).
    - Calificación final porcentual y letra (ej. `94% (A)`).
    - Créditos Carnegie obtenidos (ej. `1.0`).
  - Resumen inferior: Créditos totales acumulados, GPA acumulado oficial.
  - Bloque de certificación: Espacio para firma del padre/tutor educador y fecha.
- **Implementación Técnica:**
  - Hoja de estilos `@media print` optimizada para salida A4 / Carta con márgenes oficiales de 2 cm y cabecera institucional.
  - Botón **«Descargar PDF Oficial»** que invoca `window.print()` con maquetación paginada limpia o renderiza un PDF nativo.

---

## 6. Criterios de Aceptación

1. El padre puede configurar en 1 clic la jurisdicción del alumno (ej. Texas o Nueva York).
2. El registro en el Activity Journal incrementa de inmediato las horas acumuladas de la materia correspondiente.
3. El cálculo de Créditos Carnegie arroja valores exactos según las horas registradas.
4. El Transcript PDF se previsualiza e imprime con formato formal, sin elementos de UI web (sidebar, docks, botones de navegación).
5. Las evidencias marcadas como "destacadas" en Lane H3 se imprimen organizadas en el anexo de portafolio anual.
