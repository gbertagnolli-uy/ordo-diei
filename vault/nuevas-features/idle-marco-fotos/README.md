> **Reemplazado** por [`SPEC.md`](SPEC.md) (v2, 2026-10-14): fondo de **Unsplash** con **frases** (Vulgata + Torres Amat, Catecismo de San Pío X) y título litúrgico del día. La versión con Google Fotos quedó en [`SPEC_V1_GOOGLE_FOTOS.md`](SPEC_V1_GOOGLE_FOTOS.md).

# Idle state — marco de fotos dinámico con login por foto

> Estado: **planificación** (2026-10-13). Sin lanes creadas todavía.

## 1. Pedido del usuario (textual)

> Empecemos la planificación de estas nuevas features:
>
> Marketplace (Para canjear alguna de las monedas de la app por premios fisicos reales)
> Homeschooling (Complejo, es casi una app nueva extra)
> Sonidos UI para recompensas y acciones en la APP
> Meal planner
> Temporizadores Visuales
> Idle State: Marco de Fotos Dinamico en pantalla principal donde aparecen las fotos de los usuarios para iniciar sesion
> Kiosk Mode / App Pinning
> Musica de fondo
>
> Anota todo esto en el vault en carpetas separadas.
>
> (Más la investigación pegada: [`../ref/investigacion-1-centros-de-comando.md`](../ref/investigacion-1-centros-de-comando.md) y [`../ref/investigacion-2-software-puro.md`](../ref/investigacion-2-software-puro.md).)

Línea que corresponde a esta feature: **«Idle State: Marco de Fotos Dinamico en pantalla principal donde aparecen las fotos de los usuarios para iniciar sesion»**

## 2. Qué dice la investigación

- **Idle State: Marco de Fotos Dinámico** — inv. 1 §1: tras X minutos sin toque la UI colapsa y muestra fotos; resuelve la objeción «¿por qué una pantalla negra en la cocina?». Sincronización con Google/Apple Photos. Benchmark: Skylight, Aura, DAKboard. **Should-Have** («crucial para justificar la compra del hardware»).
- **Battery Health Mode / burn-in** — inv. 1 (insight): apagar o atenuar la pantalla de madrugada, usar sensor de luz ambiental, cuidar la batería (limitar carga ~80 %) y evitar burn-in. Una imagen que rota evita imágenes estáticas.
- **Filtrado por avatar** — inv. 1 §1: tocar la cara de un integrante lo lleva a su vista.

## 3. Interpretación del pedido del usuario

El usuario lo precisó: las fotos que aparecen en el marco son **las fotos de los usuarios (`Usuario.fotoUrl`)**, y sirven **para iniciar sesión**: tocar la foto de una persona abre su login (PIN). No es solo un salvapantallas, es la pantalla de bloqueo/selección de usuario.

## 4. Alcance propuesto (a validar)

- Detector de inactividad (sin toques X min) → pantalla de marco con fotos de los usuarios en movimiento lento (Ken Burns, transiciones suaves, desplazamiento para evitar burn-in).
- Tocar una foto → pantalla de PIN de esa persona → su home. Tocar en cualquier otro lado → selector de usuarios normal.
- Cierre de sesión automático al pasar a idle (así la tablet de pared no queda con la sesión de un niño abierta).
- Reloj/fecha discreto, y opcional: fiesta del día (santoral, ya hay datos de festividades), cumpleaños, clima.
- Atenuar/apagar de noche (horario configurable); evitar que la pantalla se apague mientras está activo → Screen Wake Lock API.
- Fase 2 (opcional): fotos familiares extra subidas por los padres; sincronizar con Google/Apple Photos queda fuera del MVP.

## 5. Preguntas abiertas

1. ¿Solo fotos de usuarios, o también fotos familiares extra?
2. ¿Tiempo de inactividad por defecto y configurable por el admin?
3. ¿Qué pasa con una tarea/timer corriendo al entrar a idle?
4. ¿Todos los usuarios aparecen o solo los que tienen foto?
5. ¿Horario nocturno de pantalla apagada/atenuada?
