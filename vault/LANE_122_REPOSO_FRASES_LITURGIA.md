# Lane 122 — Especificación: reposo v2 (Unsplash + frases) y motor Divinum Officium

Pedido (2026-10-14): planificar y especificar (1) el idle state con fotos de naturaleza de Unsplash y frases de la Vulgata Clementina/Torres Amat y del Catecismo de San Pío X, y (2) clonar el motor de Divinum Officium para el título del día, un Calendario litúrgico y una pantalla por libro. Texto completo en `vault/nuevas-features/DECISIONES.md` §10. Solo documentación: no se tocó código ni la base.

## Hecho
- `nuevas-features/DECISIONES.md` §10: pedido textual, decisiones D34–D53 y supuestos S7–S11.
- `nuevas-features/idle-marco-fotos/SPEC.md`: **reposo v2** (Unsplash, frases, título del día). La v1 con Google Fotos pasó a `SPEC_V1_GOOGLE_FOTOS.md` (marcada obsoleta).
- `nuevas-features/liturgia/`: `README.md` (pedido textual), `SPEC.md` (arquitectura, modelo, API, 8 pantallas), `SPIKE_MOTOR.md` (prueba real).
- `nuevas-features/lanes/LANES.md`: N1 y N8 canceladas, N7 reemplazada por R1–R3, nuevas L1–L9. `nuevas-features/README.md` actualizado.

## Verificado antes de especificar
- Se ejecutó el Perl de DO (commit `32be5f2`, MIT) en esta máquina: `officium.pl` para el 14-10-2026 en 1906 da exactamente «S. Callisti Papæ et Martyris ~ Duplex / Tempora: Feria Quarta infra Hebdomadam XX post Octavam Pentecostes II. Octobris», el título del ejemplo del pedido. También 1888, 1570, Misa y Kalendarium. Tiempos y tamaños en `SPIKE_MOTOR.md`.
- `setupstring()` de DO, llamada desde un script Perl propio, exporta archivos sueltos con condicionales resueltos ⇒ no hace falta portar código a TS (D48).
- DO no tiene Misal de 1888 (usa el de 1910, D53); su español no es Torres Amat y a veces cae a otro idioma (D52).
- Vercel no ejecuta Perl (lane 41) ⇒ todo se pre-genera y la app solo lee la base (D47).
- `ConfigReposo`/`FotoReposo` no existen en `prisma/schema.prisma`.

## No verificado / pendiente
- Texto digital fiable de **Torres Amat**: no hay dataset limpio; la lane R1 debe verificar contra escaneos del s. XIX y normalizar la numeración de los salmos.
- Deduplicación real del almacenamiento (L1) y la regla dominical de los misterios del Rosario (L9).
- Las dependencias Perl se instalaron solo en el scratchpad de la sesión; la instalación reproducible es `scripts/liturgia/instalar-perl.sh` (lane L2).
