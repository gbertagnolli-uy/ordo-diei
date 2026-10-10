// Tests de integración para administración de cartas católicas (Lane 36)

import test from "node:test";
import assert from "node:assert/strict";
import prisma from "../prisma.ts";
import {
  adminListarCartas,
  adminCrearCarta,
  adminActualizarCarta,
  adminArchivarCarta,
  adminRestaurarCarta,
  listarCartasUsuario,
} from "./server.ts";
import { esquemaCartaAdmin } from "./esquema.ts";
import { contenidoVisible, type CartaCompletaEntrada } from "./revelado.ts";

// Escribe en la base de DATABASE_URL, que hoy es la de producción: solo corre con PERMITIR_TESTS_DB=1
const sinBase = process.env.PERMITIR_TESTS_DB !== "1" && "requiere PERMITIR_TESTS_DB=1 (escribe en la base real)";

test("Lane 36: Panel y lógica de administración de cartas", { skip: sinBase }, async (t) => {
  const timestamp = Date.now();
  const claveTest1 = `carta-admin-test-1-${timestamp}`;

  // 1. Crear usuarios de prueba (Padre e Hijo)
  const padre = await prisma.usuario.create({
    data: {
      nombre: `__test_padre_${timestamp}__`,
      pinSecretoHash: "hash_padre",
      fechaNacimiento: new Date("1980-05-15T00:00:00.000Z"),
      rolFamiliar: "Padre",
      availablePoints: 100,
      incienso: 0,
    },
  });

  const hijo = await prisma.usuario.create({
    data: {
      nombre: `__test_hijo_${timestamp}__`,
      pinSecretoHash: "hash_hijo",
      fechaNacimiento: new Date("2010-08-20T00:00:00.000Z"),
      rolFamiliar: "Hijo",
      availablePoints: 50,
      incienso: 0,
    },
  });

  let idCartaCreada1 = 0;
  let idCartaCreada2 = 0;

  t.after(async () => {
    // Limpieza
    const ids = [idCartaCreada1, idCartaCreada2].filter((id) => id > 0);
    if (ids.length > 0) {
      await prisma.cartaUsuario.deleteMany({
        where: { cartaId: { in: ids } },
      });
      await prisma.carta.deleteMany({
        where: { id: { in: ids } },
      });
    }
    await prisma.usuario.deleteMany({
      where: { id: { in: [padre.id, hijo.id] } },
    });
  });

  // Test 1: Crear una carta con las 4 imágenes explícitas
  const nueva1 = await adminCrearCarta(
    {
      clave: claveTest1,
      nombre: "San Gabriel Arcángel Test",
      subtitulo: "Fortaleza de Dios",
      categoria: "Angel",
      rareza: "Perfecta",
      celebracion: "09-29",
      historia: "Historia hagiográfica de prueba con más de diez caracteres.",
      oracion: "Oración devocional de prueba al Arcángel.",
      frase: "No temas, porque has hallado gracia delante de Dios.",
      fraseAutor: "Evangelio según San Lucas",
      datasheet: [
        { etiqueta: "Jerarquía", valor: "Arcángel" },
        { etiqueta: "Misión", valor: "Mensajero de la Encarnación" },
        { etiqueta: "Símbolo", valor: "Lirio de pureza" },
        { etiqueta: "Fiesta", valor: "29 de Septiembre" },
      ],
      imagenUrl: "/cartas/test/arcangel-1.webp",
      imagenGrado2Url: "/cartas/test/arcangel-2.webp",
      imagenGrado3Url: "/cartas/test/arcangel-3.webp",
      imagenGrado4Url: "/cartas/test/arcangel-4.webp",
      creditoImagen: "Dominio público",
      fragmentosRequeridos: 120,
    },
    padre.id
  );

  idCartaCreada1 = nueva1.id;
  assert.equal(nueva1.clave, claveTest1);
  assert.equal(nueva1.origen, "Manual");
  assert.equal(nueva1.editadaManual, true);
  assert.equal(nueva1.activa, true);
  assert.equal(nueva1.fragmentosRequeridos, 120);

  // Test 2: Crear una carta con SOLO imagen de Grado I (debe heredar a grados II, III y IV)
  const nueva2 = await adminCrearCarta(
    {
      nombre: "Santa Catalina de Siena Test",
      categoria: "Santo",
      rareza: "Comun",
      celebracion: "04-29",
      historia: "Doctora de la Iglesia y patrona de Europa en prueba.",
      oracion: "Señor, enciende en nosotros tu divino amor.",
      frase: "Si eres lo que debes ser, prenderás fuego al mundo entero.",
      fraseAutor: "Santa Catalina de Siena",
      datasheet: [
        { etiqueta: "Nacimiento", valor: "1347" },
        { etiqueta: "Fallecimiento", valor: "1380" },
        { etiqueta: "Doctorado", valor: "1970 por San Pablo VI" },
        { etiqueta: "Fiesta", valor: "29 de Abril" },
      ],
      imagenUrl: "/cartas/test/catalina-1.webp",
    },
    padre.id
  );

  idCartaCreada2 = nueva2.id;
  assert.ok(nueva2.clave.startsWith("santa-catalina-de-siena-test"));
  assert.equal(nueva2.imagenGrado2Url, null);
  assert.equal(nueva2.imagenGrado3Url, null);
  assert.equal(nueva2.imagenGrado4Url, null);

  // Verificar fallback de imágenes en contenidoVisible
  const entradaAdaptada: CartaCompletaEntrada = {
    clave: nueva2.clave,
    nombre: nueva2.nombre,
    categoria: nueva2.categoria,
    rareza: nueva2.rareza,
    historia: nueva2.historia,
    oracion: nueva2.oracion,
    frase: nueva2.frase,
    datasheet: nueva2.datasheet as Array<{ etiqueta: string; valor: string }>,
    fragmentosRequeridos: nueva2.fragmentosRequeridos,
    imagenUrl: nueva2.imagenUrl,
    imagenGrado2Url: nueva2.imagenGrado2Url,
    imagenGrado3Url: nueva2.imagenGrado3Url,
    imagenGrado4Url: nueva2.imagenGrado4Url,
  };

  // En Grado I (100%), II (150%), III (200%), IV (300%) siempre devuelve imagenUrl por fallback
  const visGrado1 = contenidoVisible(entradaAdaptada, 20); // 100%
  const visGrado2 = contenidoVisible(entradaAdaptada, 30); // 150%
  const visGrado3 = contenidoVisible(entradaAdaptada, 40); // 200%
  const visGrado4 = contenidoVisible(entradaAdaptada, 60); // 300%
  assert.equal(visGrado1.imagenUrl, "/cartas/test/catalina-1.webp");
  assert.equal(visGrado2.imagenUrl, "/cartas/test/catalina-1.webp");
  assert.equal(visGrado3.imagenUrl, "/cartas/test/catalina-1.webp");
  assert.equal(visGrado4.imagenUrl, "/cartas/test/catalina-1.webp");

  // Test 3: La carta creada aparece de inmediato en el catálogo de todos (en blanco y negro / bloqueada)
  const coleccionHijo = await listarCartasUsuario(hijo.id);
  const encontradaEnHijo = coleccionHijo.cartas.find((c) => c.id === idCartaCreada1);
  assert.ok(encontradaEnHijo);
  assert.equal(encontradaEnHijo.desbloqueada, false);
  assert.equal(encontradaEnHijo.fragmentos, 0);
  assert.equal(encontradaEnHijo.grado, 0);
  assert.equal(encontradaEnHijo.historia.valor, "???");

  // Test 4: Modificar y reordenar el datasheet de una carta
  const datasheetReordenado = [
    { etiqueta: "Fiesta", valor: "29 de Septiembre" },
    { etiqueta: "Jerarquía", valor: "Arcángel" },
    { etiqueta: "Misión", valor: "Mensajero de la Encarnación" },
    { etiqueta: "Símbolo", valor: "Lirio de pureza" },
    { etiqueta: "Atributo Extra", valor: "Alas doradas" },
  ];

  const cartaActualizada = await adminActualizarCarta(idCartaCreada1, {
    nombre: "San Gabriel Arcángel Test (Actualizado)",
    categoria: "Angel",
    rareza: "Perfecta",
    celebracion: "09-29",
    historia: "Historia actualizada de San Gabriel Arcángel.",
    oracion: "Oración devocional actualizada.",
    frase: "No temas, porque has hallado gracia delante de Dios.",
    datasheet: datasheetReordenado,
    imagenUrl: "/cartas/test/arcangel-1-edit.webp",
    fragmentosRequeridos: 120,
  });

  assert.equal(cartaActualizada.nombre, "San Gabriel Arcángel Test (Actualizado)");
  assert.equal(cartaActualizada.editadaManual, true);
  assert.equal((cartaActualizada.datasheet as Array<{ etiqueta: string }>).length, 5);
  assert.equal((cartaActualizada.datasheet as Array<{ etiqueta: string }>)[0].etiqueta, "Fiesta");

  // Test 5: Listado administrativo incluye campos especiales
  const listaAdmin = await adminListarCartas();
  const adminItem1 = listaAdmin.find((c) => c.id === idCartaCreada1);
  assert.ok(adminItem1);
  assert.equal(adminItem1.editadaManual, true);
  assert.equal(adminItem1.origen, "Manual");

  // Test 6: Archivar carta (soft delete)
  const archivada = await adminArchivarCarta(idCartaCreada1);
  assert.equal(archivada.activa, false);

  // Al estar archivada, ya NO debe aparecer en el catálogo público de los usuarios
  const coleccionPostArchivo = await listarCartasUsuario(hijo.id);
  const existeAun = coleccionPostArchivo.cartas.some((c) => c.id === idCartaCreada1);
  assert.equal(existeAun, false);

  // Test 7: Restaurar carta archivada
  const restaurada = await adminRestaurarCarta(idCartaCreada1);
  assert.equal(restaurada.activa, true);

  const coleccionPostRestaurar = await listarCartasUsuario(hijo.id);
  const existeNuevamente = coleccionPostRestaurar.cartas.some((c) => c.id === idCartaCreada1);
  assert.equal(existeNuevamente, true);

  // Test 8: Validación de esquema (Zod rechaza < 4 datos en datasheet o historia muy corta)
  assert.throws(() => {
    esquemaCartaAdmin.parse({
      nombre: "Carta Inválida",
      categoria: "Santo",
      rareza: "Comun",
      historia: "Corta", // < 10 chars
      oracion: "Paz", // < 5 chars
      frase: "Luz", // < 5 chars
      datasheet: [{ etiqueta: "D1", valor: "V1" }], // < 4 datos
      imagenUrl: "/cartas/inv.webp",
    });
  });
});
