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

## 9. Pendiente para la lane L1

1. Elegir la salida más fácil de parsear: `officium.pl` (tabla HTML) vs `standalone/tools/epubgen2/EofficiumXhtml.pl` (XHTML más simple) vs `Pofficium.pl`.
2. Medir la deduplicación real por bloques en un mes de las tres versiones.
3. Confirmar la regla exacta de respaldo de idioma y cómo detectarla.
4. Fijar las opciones de salida (`nofancychars`, `votive`, `testmode`, sin enlaces ni JS).
