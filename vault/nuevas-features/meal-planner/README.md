# Meal planner

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

Línea que corresponde a esta feature: **«Meal planner»**

## 2. Qué dice la investigación

- **Meal Planner con «Push» a e-commerce** — inv. 1 §3: planificador semanal que al detectar faltantes genera una lista de compras; oportunidad: integrar Instacart/Amazon Fresh para aprobar la compra con un clic. Benchmark: Mango Display, Mealime, Cozi. Prioridad: el e-commerce es **Could-Have**.
- **Filtrado por perfil** — inv. 1 §1: al tocar a «Leo» se ve *su* menú (preferencias/alergias por persona).
- Inv. 1 §3: priorizar integraciones por sobre construir desde cero.

## 3. Alcance propuesto (a validar)

MVP:
- Plan semanal (desayuno/almuerzo/merienda/cena × 7 días) editable por los padres, visible en la pantalla principal y en el perfil de cada persona.
- Recetas con ingredientes → **lista de compras** generada del plan, con tildado y agrupación.
- Reutilizar recetas, «favoritas», repetir semana.

Después:
- Despensa/faltantes; asignar quién cocina (tarea/hábito de la cocina con XP).
- Integración de compras (no aplicable de entrada; en Uruguay evaluar proveedores locales).
- Importar receta desde un enlace.

Importante: en una app católica de familia, considerar **días de abstinencia/ayuno** (viernes, Cuaresma) como marca opcional en el plan; el calendario litúrgico ya existe por las cartas.

## 4. Preguntas abiertas

1. ¿Cuántas comidas por día se planifican?
2. ¿Los niños votan o piden comidas (y lo aprueba el padre)?
3. ¿Interesa el costo estimado / presupuesto semanal?
4. ¿Lista de compras compartida en el móvil de los padres (PWA)?
5. ¿Alergias/restricciones por persona?
