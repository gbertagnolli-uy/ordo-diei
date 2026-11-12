# Spike del motor Divinum Officium — lo que ya se verificó (2026-10-14, lane 122)

Prueba hecha en esta máquina (Arch, Perl 5.42.2) **antes** de especificar, para no diseñar sobre supuestos. Todo fuera del repo (scratchpad); nada se instaló en el sistema.

## 1. Repositorio

- <https://github.com/DivinumOfficium/divinum-officium>, rama `master`, commit probado **`32be5f267276b12256e015b2423b01606be149f5`** (2026-10-14). Licencia **MIT** (`LICENSE`).
- Motor: Perl, ~16 000 líneas en `web/cgi-bin/` (`horas/horascommon.pl` 2 344, `horas/specmatins.pl` 1 864, `missa/propers.pl` 1 312, `DivinumOfficium/SetupString.pl` 987…).
- Datos: `web/www/horas/<Idioma>/{Psalterium,Tempora,Sancti,Commune,Martyrologium}`, `web/www/missa/<Idioma>/{Ordo,Tempora,Sancti,Commune}`, `web/www/Tabulae/{Kalendaria,Transfer,Stransfer,Tempora}`, `data.txt`.
- Documentación técnica: <https://www.divinumofficium.com/www/horas/Help/technical.html> y `docs/how-the-calendar-works.md`.

## 2. Versiones (de `web/www/Tabulae/data.txt`)

```
Version,kalendar,transfer,stransfer,base,transferbase
Tridentine - 1570,1570,1570,1570
Tridentine - 1888,1888,1888,1888,Tridentine - 1570
Tridentine - 1906,1906,1906,1906,Tridentine - 1888
```
Las tres versiones pedidas **se encadenan** (1906 → 1888 → 1570): bajar «solo esas tres» implica bajar la tabla de las tres, que es lo que el pedido dice.
**Missa**: `RunTimeOptions.pm` traduce `Tridentine - 1888` y `Tridentine - 1906` a **`Tridentine - 1910`**: DO no tiene un Misal de 1888 (D53). Verificado: 1888, 1906 y 1910 dan el mismo resultado para el 15-10-2026.

## 3. Descarga mínima

`git clone --depth 1 --filter=blob:none --no-checkout` + `sparse-checkout` de:
`web/cgi-bin/`, `web/www/Tabulae/`, `web/www/horas/{Latin,Espanol,English,Ordinarium}/`, `web/www/missa/{Latin,Espanol,English}/`, y los archivos sueltos `web/www/horas/*.*`, `web/www/missa/*.*` (`horas.setup`, `missa.setup`, `Linguae.txt`, `*.dialog`; **sin ellos `officium.pl` falla** en `webdia.pl:442`).
Tamaño: Tabulae 1,6 MB · horas/Latin 19 MB · horas/Espanol 9,3 MB · horas/English 11 MB · missa/* ~5 MB c/u ⇒ **~55 MB**. **No** bajar `horas/Help/` (108 MB de imágenes) ni el resto de idiomas. El inglés hace falta porque DO lo usa de respaldo cuando falta un archivo (§4).

## 4. Dependencias Perl

`cpanfile` pide Plack/Starman (servidor web: **no hacen falta**) y `CGI`, `CGI::Session`, `Date::Calc`, `Date::Format`, `URI`, `URL::Encode`, `Algorithm::Diff`. Para generar por línea de comandos alcanzó con:
```bash
perl cpanm -n -L .cache/do-perl5 CGI CGI::Session Date::Format URI URL::Encode Algorithm::Diff
export PERL5LIB=$PWD/.cache/do-perl5/lib/perl5
```
(`cpanm` 1.7047 bajado como archivo único. `Date::Calc` no compiló —`Bit::Vector`— y **no hizo falta**: nada en `web/cgi-bin` lo usa.)

## 5. Ejecución por línea de comandos (sin servidor)

```bash
cd web/cgi-bin/horas
perl officium.pl "date1=10-14-2026&command=prayLaudes&version=Tridentine - 1906&lang1=Latin&lang2=Espanol"
cd ../missa
perl missa.pl "date=10-14-2026&command=praySanctaMissa&version=Tridentine - 1906&lang1=Latin&lang2=Espanol"
cd ../horas
perl kalendar.pl "kmonth=10&kyear=2026&version=Tridentine - 1906"
```
Comandos de Horas: `prayMatutinum`, `prayLaudes`, `prayPrima`, `prayTertia`, `praySexta`, `prayNona`, `prayVespera`, `prayCompletorium`. La salida es HTML (con cabeceras CGI y `Set-Cookie` al principio) con una tabla de dos columnas (lang1 | lang2).

### Resultados reales

| Fecha | Versión | Título que da DO |
|---|---|---|
| 14-10-2026 | Tridentine - 1906 (Horas) | **S. Callisti Papæ et Martyris ~ Duplex** · **Tempora: Feria Quarta infra Hebdomadam XX post Octavam Pentecostes II. Octobris** ← idéntico al ejemplo del pedido |
| 14-10-2026 | Tridentine - 1906 (Missa) | S. Callisti Papæ et Martyris ~ Duplex · Scriptura: Feria Quarta infra Hebdomadam XX… |
| 14-10-2026 | Tridentine - 1570 (Vísperas) | S. Callisti Papæ et Martyris ~ **Semiduplex** · Vespera de Officio occurente |
| 14-10-2026 | Tridentine - 1888 (Vísperas) | S. Teresiæ Virginis ~ Duplex · Commemoratio: S. Callisti Papæ et Martyris · A capitulo de sequenti; commemoratio de præcedenti |
| 15-10-2026 | Tridentine - 1570 (Missa) | Feria Quinta infra Hebdomadam XX post Octavam Pentecostes II. Octobris ~ Feria (Sta. Teresa no está en el calendario de 1570) |

Kalendarium de octubre 2026 (1906), fila del 14: `F.IV | 14 | Tempora: Feria Quarta infra Hebd XX post Octavam Pentecostes II. Octobris | S. Callisti Papæ et Martyris | Duplex | A capitulo de sequenti; commemoratio de præcedenti`. Trae color litúrgico como atributo `COLOR=` de la celda.

Ejemplo de Laudes 1906 (primeras líneas): `℣. Deus ✠ in adjutórium meum inténde. ℟. Dómine, ad adjuvándum me festína.` | `℣. Dios ✠ mío, ven en mi auxilio. ℟. Señor, date prisa en socorrerme.` · Antífona del Común: «Qui me conféssus fúerit…» | «Al que me reconozca delante de los hombres…».

### Tiempos y tamaños (una versión, un día)

| Documento | Tiempo | HTML |
|---|---|---|
| Matutinum | ~0,6 s | 115 KB |
| Laudes / Prima / Vesperæ / Completorium | 0,26–0,46 s | 54–64 KB |
| Missa | 0,3 s | 53 KB |
| Kalendarium (un mes) | 0,7 s | 22 KB |
| **8 Horas** | **4,9 s** | texto 210 KB → **80 KB gzip** |

Proyección sin deduplicar: ~35 MB gzip por versión y año ⇒ ~105 MB/año para las tres. **Hay que deduplicar** (salmos, ordinario y oraciones comunes se repiten todos los días): ver `SPEC.md` §5. Generar un año de las tres versiones: ~1 h 40 min en un núcleo; con 8 procesos en paralelo, ~15 min.

## 6. Exportar archivos «de libro» con las funciones originales

Script de prueba (`scripts/liturgia/do-libro.pl` en la implementación):
```perl
our $version = 'Tridentine - 1906'; our $datafolder = "$www/missa"; our $missa = 1;
require "$cgi/DivinumOfficium/SetupString.pl";
my $s = setupstring('Espanol', 'Sancti/10-14.txt', 'resolve@' => 1);   # hash sección → texto
```
Salida real: `[Officium] S. Calixto, Papa y Mártir` · `[Oratio] Oh Dios, que nos ves desfallecer…` · `[Rank] S. Calixto, Papa y Mártir;;Duplex;;3;;vide C2b` · `[Rule] vide C2b; Gloria` · `[Secreta] Mýstica nobis, Dómine, prosit oblátio…` (**en latín**: el archivo español no tiene esa sección).
⇒ Sirve para Proprium, Psalterium y Ordinarium **sin portar código** (D48). Además da el **título en español** del oficio.

## 7. Calidad del español en DO (D52)

- Cobertura de archivos (`horas`): Sancti 447 español / 491 latín · Tempora 591 / 639. `missa`: Sancti 525 / 524.
- Cuando falta una sección o archivo, DO usa otro idioma (inglés según la ayuda técnica; en la prueba de §6 apareció **latín**). La lane L2 debe **detectar el respaldo** comparando contra el latín y el inglés y marcar «sin traducción».
- Los **salmos en español son una traducción moderna** (Sal 92: «El Señor reina, vestido de majestad»), no Torres Amat.
- El **Martirologio en español** (`Espanol/Martyrologium/10-15.txt`) es una adaptación con datos actuales («n. 28 de marzo de 1515… Patrona de…», «D. - Blanco»), no la traducción del Martyrologium Romanum. El latín (`Latin/Martyrologium`) es el tradicional.

## 8. Color litúrgico

`DivinumOfficium/Main.pm::liturgical_color($titulo)` deduce el color del título: `red`, `purple`, `green`, `grey` (Difuntos, Viernes Santo), `blue` (fiestas marianas) y `black` (el resto). En DO `black`/`blue` son colores **de pantalla**; litúrgicamente equivalen a **blanco**. Mapeo en `SPEC.md` §9.

## 9. Resultados de la lane L1 (medido el 2026-10-14, lane 131)

Todo se midió con el commit fijo `32be5f26…`, Perl 5.42.2 y los scripts de exploración en un directorio temporal (nada de esto vive en `src/`). Las cifras salen de generar **octubre de 2026 × 3 versiones × 8 Horas = 744 documentos** (más una semana de prueba con Misa e inglés).

### 9.1 Salida que se parsea → `officium.pl` / `missa.pl` con `content=1`
- El parámetro **`content=1`** (documentado en el propio `officium.pl`: «if set output only content without html headers menus etc») elimina el menú, los formularios y el JavaScript. La salida queda reducida a: una cabecera `<P ALIGN=CENTER>` con el título del día y las líneas `Tempora:`/`Commemoratio:`/`Scriptura:`, un `<H2>` con la Hora y **una `<TABLE>` donde cada `<TR>` tiene dos `<TD>`** (columna 1 = latín, columna 2 = idioma 2).
- Por qué no `EofficiumXhtml.pl` (epubgen2): necesita el árbol `standalone/` completo, otra configuración y no aporta nada que `content=1` no dé. **Descartado**; tampoco hace falta `Pofficium.pl`.
- El título del día queda en esa cabecera: `S. Callisti Papæ et Martyris ~ Duplex` y `Tempora: Feria Quarta infra Hebdomadam XX post Octavam Pentecostes II. Octobris` (idéntico al ejemplo del pedido). Con `content=1` **no** hace falta `kalendar.pl` para el título, pero sí para el calendario de todo el año (11 000 filas baratas: 0,7 s por mes).
- Estructura de cada celda: el nombre de la sección es un `<FONT SIZE='+1' COLOR="red"><B><I>Título</I></B></FONT>` (puede aparecer **en medio** de la celda, p. ej. «Secreta» dentro de la fila del «Orate fratres»); las rúbricas son `<FONT SIZE='1' COLOR="red">…`; `℣.`/`℟.`/`Ant.` van en `<FONT COLOR="red"><I>…`; los números de verso de los salmos en `<FONT SIZE='1' COLOR="red">92:1</FONT>`; la cruz es un `<span style='color:red;…'>✠</span>`; la capitular decorada es `<FONT SIZE='+2' COLOR="red"><B><I>G</I></B></FONT>lória` (**hay que re-unir la letra inicial con el resto de la palabra**). Cada celda empieza con un `<DIV ALIGN='right'>` de navegación (Top/Next) que se descarta.
- Las cabeceras HTTP (`Content-type`, `Set-Cookie`) salen antes de la primera línea en blanco: se quitan.

### 9.2 Deduplicación medida (octubre de 2026, 744 documentos)
| Medida | Resultado |
|---|---|
| Filas (bloques) totales | 10 968 |
| Filas **únicas** (SHA-256 de latín+idioma 2, sin la navegación) | **1 214 (11 %)** |
| Bytes de HTML totales / únicos | 32,4 MB / 4,7 MB (**14,7 %**) |
| Únicas por versión | 1906: 1 041 · 1888: 1 041 · 1570: 785 |
| Crecimiento (1906, días 1…3 / 7 / 15 / 31) | 204 / 346 / 696 / 1 041 filas; 0,73 / 1,26 / 2,56 / 3,95 MB; comprimido (zlib) 0,18 / 0,32 / 0,65 / **1,01 MB** |

- La dedup entre versiones es alta: 1906 y 1888 comparten casi todo (se diferencian en unos pocos días) y 1570 agrega ~0,2–0,4 MB comprimidos por mes.
- **Proyección para la ventana S9 (24 meses × 3 versiones)**: ≈ 24 × (1,0 + 0,2 + 0,4) ≈ **40 MB comprimidos**, es decir ≈ **100–120 MB** de JSON sin comprimir en el peor caso (todo el HTML como texto). Postgres comprime `jsonb` grande con TOAST, y el segundo año repite mucho del primero (Sancti por fecha, Salterio por día de semana). **Cumple el objetivo de < 150 MB** de la SPEC §5; no hace falta acortar la ventana. Se vuelve a medir con datos reales tras la primera carga (L2).
- Tiempos: 744 documentos en **2 min 26 s con 8 procesos** (≈ 5 Horas/s). Un año de las tres versiones ≈ 8 760 documentos de Horas + 1 095 Misas ⇒ **≈ 30 min** con 8 procesos (mejor que los 15–100 min estimados).

### 9.3 Regla de respaldo de idioma (D52) — confirmada y más fina de lo supuesto
Se generó una semana (12–18 oct 2026, 1906, 8 Horas + Misa) con `lang2=Espanol` y con `lang2=English` y se compararon las 10 803 líneas españolas:
- El **respaldo es por línea, no por fila ni por sección**: dentro de una misma fila española aparecen líneas traducidas y líneas en **inglés** (p. ej. Misa del 14-10: la Epístola, el Gradual en parte y la Comunión salen en inglés: «Lesson from the Book of St. James the Apostle», «Once, by My holiness, have I sworn…»; en el Martirologio, «At Ceuta, in Morocco…»).
- Comparar contra el inglés generado solo sirve cuando las dos columnas tienen el mismo número de líneas (**79 filas no lo cumplen**) y obliga a **duplicar la generación**. **Regla elegida (sin duplicar):** una línea española se marca `esFalta` si (a) es **idéntica a la línea latina** equivalente (más de 20 caracteres), o (b) la heurística de palabras funcionales detecta **inglés** (≥ 2 palabras como *the, of, and, to, who, his, with, shall…* y más que las españolas ×1,5), o (c) es una referencia bíblica en inglés (`James 1:12-18.`, `Luke 14:26-33.`: nombres de libro ingleses).
- Medición contra la comparación exacta con el inglés (donde era posible): de las 36 líneas españolas idénticas a la inglesa (más de 12 caracteres) la heurística (b) detectó 18; las 18 restantes son **referencias** (`James 1:12-18.`, `Luke 14:26-33.`, `Prov 31:10-31`, que cubre (c)), rúbricas **latinas** que DO deja iguales en todos los idiomas (`De Patrono vel Titulo Ecclesiæ`, `fiat com. consueata…`, que cubre (a)) y un encabezado inglés corto (`Martyrology {anticipated}`) que **ninguna regla cubre**: se agrega a una lista de encabezados ingleses conocidos en el parser. En una muestra al azar de 25 líneas marcadas por (b), revisadas a mano, **0 falsos positivos**.
- La L2 deja `esFalta` por segmento y los dorados del parser fijan la regla. Si más adelante hace falta exactitud, se puede generar una segunda pasada con `lang2=English` solo para la ventana en curso.

### 9.4 Opciones de salida
- **Se usa**: `content=1`, `lang1=Latin`, `lang2=Espanol`, `version=Tridentine - NNNN`, `command=pray<Hora>` (`date1=MM-DD-YYYY` en Horas; `date=` en Misa), sin `votive` (queda `Hodie`). Salmos en la numeración de la Vulgata (cada `Psalmus N` lo muestra).
- **No hace falta**: `nofancychars`, `testmode`, `expand`. Las letras capitales decoradas se normalizan en el parser (re-unir la inicial). No hay enlaces ni JS con `content=1`.
- **Cuidado**: sin `content=1` el motor emite `Set-Cookie` por la salida de errores (stderr) y el HTML completo con menús; con `content=1` stderr queda vacío y por stdout sale solo `Content-type` + el contenido. Cada proceso debe correr con `cwd` = `web/cgi-bin/horas` o `…/missa` (rutas relativas del motor) y `PERL5LIB` apuntando a las librerías instaladas.

### 9.5 Misa «solo el propio» vs «Misa completa»
`missa.pl` **no separa** el Propio del Ordinario: devuelve **siempre la Misa completa** (Incipit, Introíbo, Introito, Kyrie, Gloria, Oratio, Lectio, Graduale, Evangelium, Credo, Offertorium, Secreta, Præfatio, Canon, Pater, Agnus, Communio, Postcommunio, Ite, Leonianas…) con cada parte propia en su sitio. 55 filas en el 14-10-2026.
- El «solo el propio» de la SPEC §10.3 se **deriva** en el parser: cada sección lleva `clave` y un marcador `propio: true` para las secciones Introitus, Oratio, Lectio/Epistola, Graduale/Tractus/Alleluja/Sequentia, Evangelium, Offertorium, Secreta, Præfatio (si es propia), Communio, Postcommunio y las conmemoraciones. Con el filtro se obtiene el propio y con todas, la Misa completa. No se necesita una segunda ejecución.
- Hay filas **sin título** (las oraciones del Ordinario) que se agrupan bajo la sección anterior con clave `ordo`.

### 9.6 Rosario: de dónde salen las oraciones
- **Están en DO**: `Pater noster`, `Ave Maria`, `Credo` (Símbolo de los Apóstoles), `Gloria` (Gloria Patri) en `horas/<Idioma>/Psalterium/Common/Prayers.txt` (latín y español); `Salve Regina` vía `@Psalterium/Mariaant:Postpentecost` (`Mariaant.txt`, latín y español); `Oremus`, `Kyrie` y `Dominus vobiscum` también.
- **No están en DO** (verificado con `grep`): la **Letanía Lauretana**, el **Signum Crucis** como oración suelta, la **oración de Fátima** («O mi Jesús») y los **nombres/frutos/citas de los 15 misterios**. Van en `src/data/liturgia/rosarium.json` con su fuente anotada (SPEC §10.8). Quedan registrados en `PENDIENTES_REPOSO_LITURGIA.md` para revisión del usuario (textos de la letanía y de los frutos).

### 9.7 Otros hallazgos útiles para L2
- Verificado: `kalendar.pl` (1906) responde para enero 2026, octubre 2035 y diciembre 2035, y `officium.pl` para el 31-12-2035 (1570: «S. Silvestri Papæ et Confessoris ~ Duplex», commemoración de la Octava de Navidad). El rango 2026–2035 es viable; L2 genera y revisa cada mes.
- Sin red no hay nada que bajar tras `descargar.sh` + `instalar-perl.sh`.
- Los documentos de Matutinum pesan ~2× el resto (115 KB de HTML vs 54–64 KB): son los que más aportan al total.
