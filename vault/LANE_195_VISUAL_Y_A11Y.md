# Lane 195 — pasada visual y de accesibilidad (F7)

Primera verificación **en un navegador real**: Chromium headless con la app compilada y una sesión de prueba (solo lectura), a 390×844 (teléfono) y 820×1180 (tablet), con capturas, errores de consola, desborde horizontal y **axe-core (WCAG 2 A/AA)** en 14 pantallas de padres y 7 de hijos. Resultado: sin desbordes ni errores de consola; capturas con aspecto coherente.

Hallazgos corregidos:
- **Lectura**: las pestañas «Leyendo / Por leer / Leídos» eran `Tabs` sin paneles (`aria-controls` roto, crítico) → ahora son botones con `aria-pressed`.
- **Lectura y Memoria** en teléfono: las tres tarjetas de resumen en una fila se apretaban y recortaban el ícono → una columna en teléfono, tres desde `sm`.
- **Contraste** del reloj de la barra lateral (`/60` → `/80`; era previo a Estudio).

El script de recorrido vive fuera del repo (`dev/_verif/recorrer.mjs`).
