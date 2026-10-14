# Lane H6 — Neurodivergencia, Kiosk y Centro de Comando Familiar

> **Estado:** Lista para ejecución cuando las fases formativas estén operativas.  
> **Dependencias:** Lane H2 (Hoy Aprendo) y configuraciones globales de usuario.  
> **Tamaño:** M (Accesibilidad sensorial + UX cognitiva + Protección de hardware de pared).

---

## 1. Objetivo de la Lane

Adaptar el ecosistema de Homeschooling para niños con **TDAH, Trastorno del Espectro Autista (TEA) y dislexia**, eliminando la sobrecarga cognitiva y sensorial mediante tableros ultra-simplificados (**First/Then Boards**), historias sociales visuales y un **Modo de Baja Estimulación Sensorial**. En paralelo, optimizar la experiencia para tablets de pared 24/7 mediante el **Battery Health Mode** (apagado nocturno OLED para evitar hinchazón de baterías y pantallas quemadas).

---

## 2. Accesibilidad para Neurodivergencia

### 2.1 Tablero "Primero / Después" (First/Then Board)
- **Concepto:** Una de las herramientas más efectivas en educación especial. En lugar de un calendario complejo que genera ansiedad ejecutiva, la pantalla del niño puede alternar al modo "Primero / Después".
- **Estructura Visual:**
  - Dos columnas enormes de alto contraste:
    1. **PRIMERO:** La lección o tarea obligatoria del momento (ej. *"15 min de Lectura"* con barra de tiempo visual).
    2. **DESPUÉS:** La recompensa o actividad placentera inmediata (ej. *"15 min de Construcción con Lego"* o *"Recreo al aire libre"*).
  - Al completar la columna "Primero", la tarjeta se desvanece con un sonido suave de campana y la recompensa se activa con un temporizador.

### 2.2 Historias Sociales Visuales (Social Stories)
- **Concepto:** Cuentos visuales estructurados para preparar emocionalmente a niños con TEA ante rupturas de la rutina (ej. *"Hoy no hay clase porque vamos al dentista"* o *"Hoy recibiremos visitas"*).
- **Implementación:**
  - Componente modal visual con pictogramas e ilustraciones que explica en 3 pasos la transición del día, reduciendo la ansiedad y los episodios de crisis (*meltdowns*).

### 2.3 Modo de Baja Estimulación Sensorial (Low Sensory Mode)
- **Selector:** Toggle accesible en la cabecera o perfil del alumno: `Modo Sensorial Relajado`.
- **Efectos en la Aplicación:**
  - **Framer Motion & Animaciones:** Se fuerza `@media (prefers-reduced-motion: reduce)` suprimiendo transiciones bruscas, rebotes y vibraciones.
  - **Paleta de Colores:** Se reemplazan los degradados brillantes y colores primarios saturados por tonos pastel suaves (salvia, arena, azul nórdico) con tipografía legible de alto contraste.
  - **Paisaje Sonoro:** Se silencian fanfarrias estridentes y confeti sonoro; las felicitaciones se emiten mediante tonos de campana tibetana suave o frecuencias relajantes tipo ASMR.

---

## 3. Centro de Comando de Pared y Cuidado de Hardware

### 3.1 Kiosk Mode & Fullscreen PWA
- Disparo automático de la Fullscreen API (`document.documentElement.requestFullscreen()`) tras la primera interacción en la tablet.
- Bloqueo táctil preventivo en bordes para evitar la salida accidental al sistema operativo Android o iOS.

### 3.2 Battery Health & Screen Care Curfew (Modo Toque de Queda)
- **Pain Point Resuelto:** Las tablets de pared enchufadas permanentemente sufren hinchazón de batería de litio por calor continuo y marcado permanente de imagen (*burn-in* en paneles OLED/IPS).
- **Mecánica de Software:**
  - Configuración horaria: por defecto de **22:00 a 07:00**.
  - Durante este horario, si no hay toques en 1 minuto, la pantalla no muestra fotos ni reloj; se apaga completamente a **negro absoluto OLED (`#000000`)**, desactivando el backlight en paneles compatibles.
  - Al primer toque matutino, la pantalla despierta suavemente con el saludo del día y la liturgia/santo de `romcal`.

---

## 4. Criterios de Aceptación

1. El alumno puede alternar su vista al modo "Primero / Después", visualizando exclusivamente una tarea y su recompensa.
2. Al activar el Modo Baja Estimulación, desaparecen las animaciones de confeti y los colores chillones.
3. El toque de queda nocturno (Curfew) sumerge la pantalla en negro absoluto durante las horas de descanso familiar.
4. El modo Kiosk se mantiene estable en pantalla completa en el navegador de la tablet.
