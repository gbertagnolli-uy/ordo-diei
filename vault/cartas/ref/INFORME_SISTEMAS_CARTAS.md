# Informe aportado por el usuario (2026-10-10) — textual

> Pegado por el usuario como insumo para ampliar el sistema de cartas. Se conserva sin cambios. Qué se adopta y qué no: `vault/CARTAS_CATOLICAS.md` §2.4 y §3 (D13–D18). Las referencias `[[n]]` son del informe original.

---

# Análisis Comparativo de Sistemas de Cartas y Progresión por Fragmentos

## 1. El Fenómeno Pokémon TCG: Psicología del Valor y la Colección
El éxito de Pokémon Trading Card Game (TCG), tanto en su versión física como digital (Pokémon TCG Pocket), no se basa únicamente en la mecánica de juego, sino en una convergencia de factores psicológicos y económicos bien documentados.

*   **Nostalgia y Vinculación Emocional**: La nostalgia juega un papel decisivo en el mercado, ya que muchos coleccionistas iniciaron su viaje en la infancia o adolescencia y continúan vinculados emocionalmente a la marca [[34]]. Esto transforma la carta de un simple objeto de cartón a un artefacto de memoria personal.
*   **Escasez Bimodal y Percepción de Valor**: El mercado es bimodal; la inmensa mayoría de las cartas tienen un valor intrínseco bajo, pero un pequeño porcentaje (primeras ediciones, cartas holográficas, errores de impresión) concentra casi todo el valor económico [[4]]. Esta escasez percibida genera la "ilusión de la mano caliente" (hot hand trap), donde el usuario siente que la próxima carta podría ser la valiosa [[41]].
*   **Graduación (Grading) como Certificación de Activos**: Empresas como PSA o Beckett certifican el estado físico de la carta (ej. "Gem Mint 10"). Esto convierte la colección en un activo financiero líquido, verificable y con un mercado secundario robusto, separando el valor del "juego" del valor de "inversión" [[39]], [[40]].
*   **Utilidad Dual**: Las cartas satisfacen dos necesidades simultáneas: la utilidad competitiva (armar un mazo ganador) y la satisfacción estética/coleccionista (completar el álbum) [[1]].

## 2. Mecánicas de Fragmentos y Duplicados en Juegos Freemium/Gacha
Los juegos móviles modernos han perfeccionado el sistema de "fragmentos" o "planos" para resolver un problema de diseño: ¿qué hacer cuando el usuario obtiene una carta que ya tiene? En lugar de ser un desperdicio, el duplicado se convierte en el motor de la progresión a largo plazo.

### 2.1. Clash Royale / Clash of Clans (Sistema de Comodines y Evolución)
*   **Conversión de Duplicados**: Cuando un usuario obtiene una carta que ya tiene en su nivel máximo (o en general), esta se convierte automáticamente en "comodines" (wildcards) o fragmentos universales que pueden asignarse a cualquier carta de esa rareza [[47]]. Esto elimina la frustración del duplicado inútil.
*   **Evolución de Cartas (Card Evolution)**: Supercell introdujo un sistema donde, además de subir de nivel, las cartas requieren "Evo Shards" (fragmentos de evolución) específicos [[11]]. Estos fragmentos no se obtienen abriendo sobres normales, sino a través de misiones diarias, eventos o progresión lenta, garantizando la retención a largo plazo y dando un objetivo claro más allá del nivel máximo [[14]].

### 2.2. Asphalt 9 (Sistema de Planos / Blueprints y "Doble Desbloqueo")
*   **Desbloqueo por Acumulación**: Un vehículo no se obtiene de una vez. Se requieren decenas de "planos" (blueprints) específicos de ese coche para desbloquearlo inicialmente (ej. 70 planos) [[57]].
*   **Doble Desbloqueo (Double Unlock)**: Una vez desbloqueado el coche, se necesitan *más* planos del mismo tipo para subir sus "estrellas" y mejorar sus estadísticas base [[58]]. Esta mecánica alarga artificialmente la curva de progresión, pero genera una sensación constante de avance incremental ("solo me faltan 3 planos para la siguiente estrella").

### 2.3. Summoners War (Sistema de Sacrificio y "Awakening")
*   **Duplicados como Recurso de Evolución**: Para subir un monstruo de 3 a 4 estrellas, el jugador debe "alimentarlo" con otro monstruo del mismo tipo y nivel. 
*   **Despertar (Awakening)**: Para desbloquear la forma final y las habilidades máximas de un personaje, se requiere sacrificar múltiples copias del mismo monstruo o un recurso premium escaso (como los "Devilmons", monstruos de experiencia genéricos) [[52]], [[53]]. Esto convierte a los duplicados en el recurso más codiciado del juego, no en un desecho.

---

## 3. Análisis de los Niveles de Personajes / Cartas
En estos sistemas, el "nivel" no es una simple barra de experiencia (XP). Se estructura en capas concéntricas de progresión:

1.  **Nivel Base (Desbloqueo)**: Se alcanza al reunir los fragmentos iniciales. Desbloquea la imagen, el nombre y la descripción básica.
2.  **Nivel de Estadística (XP / Oro)**: Mejora numérica lineal. En juegos de batalla, sube el ataque/defensa. En juegos de colección, puede desbloquear variaciones de arte o marcos decorativos.
3.  **Nivel de Rango / Estrellas (Star Up / Awakening)**: Requiere **duplicados o fragmentos específicos**. Cambia la apariencia visual de la carta (ej. de un boceto a color, de color a holográfico) y desbloquea contenido narrativo o mecánico profundo (nuevas habilidades en juegos de combate).
4.  **Nivel de Evolución (Mecánica de Retención)**: Un sistema paralelo que requiere un recurso especial obtenido solo con el tiempo o en eventos, otorgando un estatus visual único (ej. un borde animado en la carta) que sirve como señal de estatus dentro de la comunidad.

---

## 4. Aplicación Operativa al Sistema de Cartas Católicas

Basado en el análisis anterior, y respetando las restricciones de no incluir mecánicas de batalla, ataque o defensa, propongo la siguiente adaptación técnica para la feature solicitada:

### 4.1. Reconceptualización de los "Fragmentos"
Para mantener la coherencia temática y la profundidad operativa, los fragmentos no deben llamarse "piezas de carta". Se denominarán **"Reliquias"** o **"Testimonios"**. 
*   *Mecánica*: Al abrir un sobre o comprar en la tienda, el usuario recibe "Testimonios de [Santo X]". 
*   *Psicología*: Acumular testimonios genera una sensación de estudio y acercamiento progresivo a la figura, en lugar de una simple transacción comercial.

### 4.2. Sistema de "Grados de Veneración" (Sustituto del Leveling / Awakening)
En lugar de subir el "nivel de ataque", la carta progresa en **Grados de Veneración** al consumir duplicados (Testimonios). Esto estructura la pantalla de detalle de la carta en capas de desbloqueo de contenido:

| Grado | Requisito de Fragmentos | Contenido Desbloqueado en la Pantalla de Detalle |
| :--- | :--- | :--- |
| **I. Conocimiento** | 0 - 49% | Silueta en blanco y negro, nombre, categoría y fecha de celebración. |
| **II. Beato / Reconocido** | 50% - 99% | Imagen a color, historia biográfica resumida, año de nacimiento. |
| **III. Santo / Venerado** | 100% (Desbloqueo) | Imagen completa con marco según rareza, historia detallada, virtud principal. |
| **IV. Iluminado (Awakening)** | 150% - 200% (Duplicados) | **Oración completa** interactiva, frase célebre con tipografía especial, y un fondo de arte alternativo o animación sutil (ej. un halo o luz). |

*Nota operativa*: Este enfoque convierte el "duplicado" en algo altamente deseable, ya que es la única forma de acceder a la oración y al contenido espiritual completo de la carta, alineando la mecánica de juego con el propósito devocional.

### 4.3. La Tienda y la Escasez Significativa (No Predatoria)
*   **Sobre de "Meditación" (Común/Buena)**: Costo bajo en puntos. Garantiza testimonios de santos locales o figuras históricas estándar.
*   **Sobre de "Revelación" (Perfecta/Celestial)**: Costo alto. Garantiza al menos un testimonio de rareza alta.
*   **Intercambio de Duplicados**: Implementar una mecánica similar a los "comodines" de Clash Royale. Si el usuario tiene una carta en el Grado IV (100%+), los testimonios adicionales de esa carta se convierten automáticamente en **"Granos de Incienso"** (moneda de intercambio universal) que pueden usarse para comprar testimonios de *cualquier* carta específica en la tienda, dando al usuario control sobre su progresión y evitando la frustración del duplicado inútil.

### 4.4. Eventos Litúrgicos como Motor de Retención (Gacha Temporal)
La lógica de eventos solicitada (50% extra en festividad, regalo total en cumpleaños) se potencia con este sistema:
*   **Festividad del Día**: Si hoy es San Francisco, los sobres abiertos otorgan un 50% más de "Testimonios de San Francisco". Esto incentiva al usuario a ingresar *específicamente* en las fechas clave del calendario litúrgico, creando un hábito de uso recurrente y significativo.
*   **Cumpleaños del Usuario**: El sistema detecta la fecha. Si coincide con la festividad de un santo, el usuario recibe los testimonios exactos para llevar esa carta al Grado IV (Iluminado), desbloqueando la animación de desbloqueo y la oración completa como un "regalo espiritual" personalizado.

### 4.5. Panel de Administración (Enfoque Operativo)
El panel para agregar nuevas cartas debe incluir campos específicos para gestionar esta progresión:
- `fragmentos_para_desbloqueo` (int)
- `fragmentos_para_iluminacion` (int, debe ser > al anterior)
- `contenido_bloqueado_nivel_1` (string: texto que se muestra como "???")
- `contenido_desbloqueado_nivel_4` (string: oración completa, frase)
- `fecha_celebracion` (date: para la lógica automática del bono del 50%).

---

## 5. Conclusión Técnica
La codicia por las cartas Pokémon o la progresión en Clash Royale no nace del azar puro, sino de **sistemas de retroalimentación clara donde cada acción (incluso obtener un duplicado) tiene un propósito acumulativo**. 

Al adaptar esto al dominio católico, la clave está en reemplazar la "codicia material" por la "profundidad devocional". El usuario no busca "subir el ataque" de un santo, busca **acceder a su historia completa, su oración y su legado**. El sistema de fragmentos y grados de veneración propuesto garantiza que la mecánica de colección sea intuitiva, profundamente satisfactoria y técnicamente robusta, sin requerir integraciones complejas ni caer en dinámicas de juego agresivas.

¿Desea que proceda a generar el esquema de base de datos (Prisma) actualizado con estos "Grados de Veneración" y la lógica de la Server Action para el reclamo de festividad/cumpleaños?
