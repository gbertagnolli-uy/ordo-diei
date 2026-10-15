# Lane 154 — Tarjeta «En curso» y reloj Flip en Modo Enfoque

## Pedido del usuario (textual)
> [Image #6] el card de "en curso" que aparece en dashboard/horarios debe ser diferente:
>
>   - No todo el texto debe aparecer dentro del circulo, sino que separado debajo del circulo. Dentro del circulo solo
>   el tiempo.
>   - Además de eso en modo fullscreen, debe mostrar un reloj con jerarqía predominante y el circulo con el timer debajo
>   y menor jerarquia.
>
> Ese reloj debe usar este repo para mostrarse: https://github.com/CogitoForge-AI/Open-Fliqlo
>
> La idea es tener un Flip Clock en la pantalla fullscreen y que el timer esté pero no predominantemente
>
> El reloj tambien debe tener modo dark y modo light.

## Decisiones
- Open-Fliqlo (MIT) es Flutter/Dart: no hay paquete npm ni se puede embeber en React. Se porta su diseño a `RelojFlip.tsx` (CSS): dígito 0.72:1, fuente Gluqlo (ISC) a 0.70 del alto, radio 0.1 del lado menor, bisagra, giro de solapa de 500 ms, separador «:». Avisos en `THIRD_PARTY_NOTICES.md`.
- Modo dark = colores originales de Fliqlo (`#1A1A1A` / `#F5F5F5` / bisagra `#0A0A0A`); modo light = variante clara propia. Sigue el tema de la app (`useThemeStore`); en Enfoque la barra superior suma un botón sol/luna porque el dock queda tapado por el overlay.
- El reloj muestra la hora real (HH:MM), no la congelada por la pausa del temporizador.
- Dentro del disco queda solo el tiempo restante; ícono, estado, título y horario pasan debajo del disco.
