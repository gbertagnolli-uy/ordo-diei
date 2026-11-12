# Lane 176 — L2: memoria (oraciones y listas de la fe) con repetición espaciada

Catálogo E5 y la hoja para copiar a mano. Vida católica: lo que se sabe de memoria se sabe de verdad.

- **Catálogo católico de la casa** (`lib/homeschooling/catolico.ts`, 26 textos con test de integridad): señal de la cruz, Padre nuestro, Ave María, Gloria, Ángel de mi guarda, bendición y acción de gracias de la mesa, Credo, Acto de contrición, Salve, Ángelus, oración a San Miguel; mandamientos de la ley de Dios y de la Iglesia, obras de misericordia, pecados capitales; sacramentos, virtudes teologales y cardinales, dones y frutos del Espíritu Santo; los cuatro grupos de misterios del Rosario. Texto tradicional en español; sin traducciones propias de la Escritura.
- **Tabla** `Homeschool_Memoria` (`Memorizacion`; aditiva). Cada texto lleva su tarjeta `ts-fsrs` (4 niveles: otra vez / difícil / bien / fácil — `responderNivel` en `servidor/repaso.ts`) y se da por **sabido** tras 3 «bien» seguidos con ≥ 30 días.
- Pestaña «Memoria»: lista con lo que toca hoy, lo que aprende y lo que ya sabe; **agregar del catálogo** (con casillas para varios hijos) o un texto propio; ver el texto; quitar.
- **Recitado** (`/memoria/recitar`, solo padres): el padre tiene la tablet, el hijo recita en voz alta sin mirar; el texto va tapado (pista = primeras palabras de cada línea; «ver el texto para corregir»); 4 botones para calificar y sigue el próximo. Pantalla del padre, no del chico.
- **Hoja para copiar a mano** (`/memoria/copia/[id]`, padres): letra grande y renglón bajo cada línea, A4 en blanco y negro (caligrafía en el cuaderno).
- Califican y administran solo los padres; el hijo ve sus textos y su avance.
- Tests: `catolico.test.ts` (4), `memoria.test.ts` (2: FSRS de 4 niveles y permisos/validaciones sin base).
- Pendiente: paquetes de curso católicos importables (L3), lectura de la Biblia en el año litúrgico.
