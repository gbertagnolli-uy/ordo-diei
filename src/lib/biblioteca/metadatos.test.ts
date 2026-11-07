import { test } from "node:test";
import assert from "node:assert/strict";
import { deflateRawSync, deflateSync } from "node:zlib";
import sharp from "sharp";
import { compararRutasArchivo, esImagenBuffer, extraerMetadatosLibro, htmlATextoPlano, parsearNombreArchivo } from "./metadatos.ts";

// ── Helpers de construcción de archivos de prueba en memoria ──────────────────

async function crearPngPrueba(color: { r: number; g: number; b: number } = { r: 180, g: 40, b: 60 }): Promise<Buffer> {
  return sharp({
    create: { width: 48, height: 64, channels: 3, background: color },
  })
    .png()
    .toBuffer();
}

async function crearJpegPrueba(): Promise<Buffer> {
  return sharp({
    create: { width: 48, height: 64, channels: 3, background: { r: 30, g: 90, b: 160 } },
  })
    .jpeg({ quality: 85 })
    .toBuffer();
}

/** Construye un archivo ZIP válido en memoria (con compresión DEFLATE o STORE y comentario opcional). */
function armarZip(archivos: { nombre: string; datos: Buffer | string; store?: boolean }[], comentario = ""): Buffer {
  const locales: Buffer[] = [];
  const centrales: Buffer[] = [];
  let offset = 0;

  for (const a of archivos) {
    const raw = typeof a.datos === "string" ? Buffer.from(a.datos, "utf8") : a.datos;
    const comp = a.store ? raw : deflateRawSync(raw);
    const metodo = a.store ? 0 : 8;
    const nombreBuf = Buffer.from(a.nombre, "utf8");

    const lfh = Buffer.alloc(30);
    lfh.writeUInt32LE(0x04034b50, 0);
    lfh.writeUInt16LE(20, 4);
    lfh.writeUInt16LE(metodo, 8);
    lfh.writeUInt32LE(comp.length, 18);
    lfh.writeUInt32LE(raw.length, 22);
    lfh.writeUInt16LE(nombreBuf.length, 26);

    locales.push(lfh, nombreBuf, comp);

    const cdfh = Buffer.alloc(46);
    cdfh.writeUInt32LE(0x02014b50, 0);
    cdfh.writeUInt16LE(20, 4);
    cdfh.writeUInt16LE(20, 6);
    cdfh.writeUInt16LE(metodo, 10);
    cdfh.writeUInt32LE(comp.length, 20);
    cdfh.writeUInt32LE(raw.length, 24);
    cdfh.writeUInt16LE(nombreBuf.length, 28);
    cdfh.writeUInt32LE(offset, 42);

    centrales.push(cdfh, nombreBuf);
    offset += lfh.length + nombreBuf.length + comp.length;
  }

  const cdBuf = Buffer.concat(centrales);
  const commBuf = Buffer.from(comentario, "utf8");
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(archivos.length, 8);
  eocd.writeUInt16LE(archivos.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(commBuf.length, 20);

  return Buffer.concat([...locales, cdBuf, eocd, commBuf]);
}

/** Construye un archivo PalmDB MOBI/AZW/AZW3 en memoria con EXTH y registro de imagen de portada. */
function armarMobi(opciones: {
  palmTitle: string;
  updatedTitle?: string;
  autores?: string[];
  descripcion?: string;
  portada?: Buffer;
}): Buffer {
  const palmTitleBuf = Buffer.from(opciones.palmTitle, "utf8");
  const exthChunks: Buffer[] = [];
  const pushExthTexto = (tipo: number, valor: string) => {
    const d = Buffer.from(valor, "utf8");
    const h = Buffer.alloc(8);
    h.writeUInt32BE(tipo, 0);
    h.writeUInt32BE(d.length + 8, 4);
    exthChunks.push(h, d);
  };
  const pushExthUint32 = (tipo: number, valor: number) => {
    const b = Buffer.alloc(12);
    b.writeUInt32BE(tipo, 0);
    b.writeUInt32BE(12, 4);
    b.writeUInt32BE(valor, 8);
    exthChunks.push(b);
  };

  if (opciones.updatedTitle) pushExthTexto(503, opciones.updatedTitle);
  for (const a of opciones.autores ?? []) pushExthTexto(100, a);
  if (opciones.descripcion) pushExthTexto(103, opciones.descripcion);
  if (opciones.portada) pushExthUint32(201, 0); // cover offset = 0 desde firstImageIndex

  const exthBody = Buffer.concat(exthChunks);
  const exthHeader = Buffer.alloc(12);
  exthHeader.write("EXTH", 0, "ascii");
  exthHeader.writeUInt32BE(12 + exthBody.length, 4);
  exthHeader.writeUInt32BE(exthChunks.filter((_, i) => i % 2 === 0 || _.length === 12).length, 8);
  // Calculamos el conteo exacto de registros EXTH
  const exthCount =
    (opciones.updatedTitle ? 1 : 0) +
    (opciones.autores?.length ?? 0) +
    (opciones.descripcion ? 1 : 0) +
    (opciones.portada ? 1 : 0);
  exthHeader.writeUInt32BE(exthCount, 8);

  const mobiHeaderLen = 232;
  const rec0Fixed = Buffer.alloc(16 + mobiHeaderLen);
  rec0Fixed.write("MOBI", 16, "ascii");
  rec0Fixed.writeUInt32BE(mobiHeaderLen, 20);
  const fullNameOffset = 16 + mobiHeaderLen + exthHeader.length + exthBody.length;
  rec0Fixed.writeUInt32BE(fullNameOffset, 84);
  rec0Fixed.writeUInt32BE(palmTitleBuf.length, 88);
  rec0Fixed.writeUInt32BE(1, 108); // firstImageIndex = record 1
  rec0Fixed.writeUInt32BE(0x40, 128); // exthFlags bit 6 attivo

  const rec0 = Buffer.concat([rec0Fixed, exthHeader, exthBody, palmTitleBuf]);
  const records = opciones.portada ? [rec0, opciones.portada] : [rec0];

  const headerSize = 78 + records.length * 8;
  const palmHeader = Buffer.alloc(headerSize);
  palmHeader.write("OrdoBook", 0, "ascii");
  palmHeader.writeUInt16BE(records.length, 76);

  let currentOffset = headerSize;
  for (let i = 0; i < records.length; i++) {
    palmHeader.writeUInt32BE(currentOffset, 78 + i * 8);
    currentOffset += records[i].length;
  }

  return Buffer.concat([palmHeader, ...records]);
}

/** Construye un archivo RAR 4.x en memoria con entradas en modo Store (0x30). */
function armarRar4Store(archivos: { nombre: string; datos: Buffer }[]): Buffer {
  const sig = Buffer.from([0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x00]);
  const mainHdr = Buffer.from([0xcf, 0x90, 0x73, 0x00, 0x00, 0x0d, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const bloques: Buffer[] = [sig, mainHdr];

  for (const a of archivos) {
    const nameBuf = Buffer.from(a.nombre, "utf8");
    const headSize = 32 + nameBuf.length;
    const hdr = Buffer.alloc(headSize);
    hdr.writeUInt16LE(0, 0); // CRC placeholder
    hdr[2] = 0x74; // FILE_HEAD
    hdr.writeUInt16LE(0x8000, 3); // LONG_BLOCK
    hdr.writeUInt16LE(headSize, 5);
    hdr.writeUInt32LE(a.datos.length, 7); // packSize
    hdr.writeUInt32LE(a.datos.length, 11); // unpSize
    hdr[25] = 0x30; // method = Store
    hdr.writeUInt16LE(nameBuf.length, 26);
    nameBuf.copy(hdr, 32);
    bloques.push(hdr, a.datos);
  }

  return Buffer.concat(bloques);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test("parsearNombreArchivo: extrae autor y título de convenciones «Autor - Título», «Título -- Autor» y limpia año/serie", () => {
  assert.deepEqual(
    parsearNombreArchivo("Gabriel García Márquez - Cien años de soledad (1967) [ Biblioteca #1 ].epub"),
    { titulo: "Cien años de soledad", autor: "Gabriel García Márquez" },
  );
  assert.deepEqual(
    parsearNombreArchivo("Gramática latina curso único e completo -- Napoleão Mendes de Almeida.epub"),
    { titulo: "Gramática latina curso único e completo", autor: "Napoleão Mendes de Almeida" },
  );
  assert.deepEqual(parsearNombreArchivo("Vulgata Clementina - 1598.epub"), {
    titulo: "Vulgata Clementina (1598)",
    autor: null,
  });
  assert.deepEqual(parsearNombreArchivo("Catecismo_de_San_Pio_X.pdf"), {
    titulo: "Catecismo de San Pio X",
    autor: null,
  });
});

test("htmlATextoPlano y compararRutasArchivo: limpian HTML y ordenan páginas naturalmente", () => {
  assert.equal(htmlATextoPlano("<p>Primera &amp; única</p><p>Segunda línea</p>"), "Primera & única\nSegunda línea");
  const paginas = ["page_10.jpg", "page_2.jpg", "page_1.jpg"].sort(compararRutasArchivo);
  assert.deepEqual(paginas, ["page_1.jpg", "page_2.jpg", "page_10.jpg"]);
});

test("extraerMetadatosLibro (ePub): lee título, subtítulo, autor principal, sinopsis y portada (EPUB 3 y EPUB 2 con XHTML)", async () => {
  const png = await crearPngPrueba();
  const containerXml = `<?xml version="1.0"?>
    <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
      <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
    </container>`;
  const opfXml = `<?xml version="1.0" encoding="utf-8"?>
    <package xmlns="http://www.idpf.org/2007/opf" version="3.0">
      <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
        <dc:title id="t1">Confesiones</dc:title>
        <meta refines="#t1" property="title-type">main</meta>
        <dc:title id="t2">Edición bilingüe</dc:title>
        <meta refines="#t2" property="title-type">subtitle</meta>
        <dc:creator opf:role="aut">San Agustín</dc:creator>
        <dc:creator opf:role="trl">Traductor Secundario</dc:creator>
        <dc:description>&lt;p&gt;Obra clásica de &lt;b&gt;San Agustín&lt;/b&gt;.&lt;/p&gt;</dc:description>
        <meta name="cover" content="cover-page"/>
      </metadata>
      <manifest>
        <item id="cover-page" href="text/cover.xhtml" media-type="application/xhtml+xml"/>
        <item id="cover-img" href="images/portada.png" media-type="image/png"/>
      </manifest>
    </package>`;
  const coverXhtml = `<html><body><img src="../images/portada.png" alt="Portada"/></body></html>`;

  const epubBuf = armarZip([
    { nombre: "META-INF/container.xml", datos: containerXml },
    { nombre: "OEBPS/content.opf", datos: opfXml },
    { nombre: "OEBPS/text/cover.xhtml", datos: coverXhtml },
    { nombre: "OEBPS/images/portada.png", datos: png },
  ]);

  const meta = await extraerMetadatosLibro(epubBuf, "epub", "archivo.epub");
  assert.equal(meta.titulo, "Confesiones: Edición bilingüe");
  assert.equal(meta.autor, "San Agustín");
  assert.equal(meta.sinopsis, "Obra clásica de San Agustín.");
  assert.ok(esImagenBuffer(meta.portada));
});

test("extraerMetadatosLibro (PDF): extrae diccionario Info (UTF-16BE y literal), XMP e imagen de portada embebida", async () => {
  const jpeg = await crearJpegPrueba();
  // Título en UTF-16BE hex: FEFF + "El Principito"
  const tituloUtf16Be = Buffer.from([0xfe, 0xff, ...Buffer.from("El Principito", "utf16le").swap16()]).toString("hex").toUpperCase();
  const cabeceraPdf = Buffer.from(
    `%PDF-1.4\n` +
      `1 0 obj\n<< /Title <${tituloUtf16Be}> /Author (Antoine de Saint-Exup\\351ry) /Subject (Relato filos\\363fico ilustrado) >>\nendobj\n` +
      `2 0 obj\n<< /Type /XObject /Subtype /Image /Width 48 /Height 64 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
    "latin1",
  );
  const cierrePdf = Buffer.from(`\nendstream\nendobj\n%%EOF`, "latin1");
  const pdfBuf = Buffer.concat([cabeceraPdf, jpeg, cierrePdf]);

  const meta = await extraerMetadatosLibro(pdfBuf, "pdf", "doc.pdf");
  assert.equal(meta.titulo, "El Principito");
  assert.equal(meta.autor, "Antoine de Saint-Exupéry");
  assert.equal(meta.sinopsis, "Relato filosófico ilustrado");
  assert.ok(esImagenBuffer(meta.portada));

  // También soporta imagen raster /FlateDecode en PDF
  const rawRgb = Buffer.alloc(48 * 48 * 3, 120);
  const flateRgb = deflateSync(rawRgb);
  const pdfFlate = Buffer.concat([
    Buffer.from(
      `%PDF-1.4\n1 0 obj\n<< /Subtype /Image /Width 48 /Height 48 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode >>\nstream\n`,
      "latin1",
    ),
    flateRgb,
    Buffer.from(`\nendstream\nendobj\n%%EOF`, "latin1"),
  ]);
  const metaFlate = await extraerMetadatosLibro(pdfFlate, "pdf", "Autor Prueba - Libro Flate.pdf");
  assert.equal(metaFlate.titulo, "Libro Flate");
  assert.equal(metaFlate.autor, "Autor Prueba");
  assert.ok(esImagenBuffer(metaFlate.portada));
});

test("extraerMetadatosLibro (MOBI, AZW y AZW3): lee cabecera PalmDB/MOBI, registros EXTH y portada binaria", async () => {
  const jpeg = await crearJpegPrueba();
  const mobiBuf = armarMobi({
    palmTitle: "Titulo Viejo",
    updatedTitle: "La Divina Comedia",
    autores: ["Dante Alighieri"],
    descripcion: "<p>Viaje por el <i>Infierno</i>, el Purgatorio y el Paraíso.</p>",
    portada: jpeg,
  });

  for (const formato of ["mobi", "azw", "azw3"] as const) {
    const meta = await extraerMetadatosLibro(mobiBuf, formato, `divina.${formato}`);
    assert.equal(meta.titulo, "La Divina Comedia");
    assert.equal(meta.autor, "Dante Alighieri");
    assert.equal(meta.sinopsis, "Viaje por el Infierno, el Purgatorio y el Paraíso.");
    assert.ok(esImagenBuffer(meta.portada));
  }
});

test("extraerMetadatosLibro (FB2): extrae metadatos y portada base64 en FB2 plano y FB2 comprimido en ZIP", async () => {
  const png = await crearPngPrueba();
  const fb2Xml = `<?xml version="1.0" encoding="utf-8"?>
    <FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0" xmlns:l="http://www.w3.org/1999/xlink">
      <description>
        <title-info>
          <book-title>Los hermanos Karamázov</book-title>
          <author><first-name>Fiódor</first-name><last-name>Dostoyevski</last-name></author>
          <annotation><p>Novela filosófica y teológica.</p></annotation>
          <coverpage><image l:href="#cover.png"/></coverpage>
        </title-info>
      </description>
      <binary id="cover.png" content-type="image/png">${png.toString("base64")}</binary>
    </FictionBook>`;

  const metaPlano = await extraerMetadatosLibro(Buffer.from(fb2Xml, "utf8"), "fb2", "karamazov.fb2");
  assert.equal(metaPlano.titulo, "Los hermanos Karamázov");
  assert.equal(metaPlano.autor, "Fiódor Dostoyevski");
  assert.equal(metaPlano.sinopsis, "Novela filosófica y teológica.");
  assert.ok(esImagenBuffer(metaPlano.portada));

  const fb2EnZip = armarZip([{ nombre: "karamazov.fb2", datos: fb2Xml }]);
  const metaZip = await extraerMetadatosLibro(fb2EnZip, "fb2", "karamazov.fb2");
  assert.equal(metaZip.titulo, "Los hermanos Karamázov");
  assert.ok(esImagenBuffer(metaZip.portada));
});

test("extraerMetadatosLibro (CBZ y CBR): lee ComicInfo.xml, comentario ComicBookInfo y elige la primera página por orden natural", async () => {
  const imgPagina2 = await crearPngPrueba({ r: 10, g: 200, b: 20 });
  const imgPagina10 = await crearJpegPrueba();
  const comicInfo = `<?xml version="1.0"?>
    <ComicInfo>
      <Title>Tintín en el Tíbet</Title>
      <Writer>Hergé</Writer>
      <Summary>Aventura en las montañas del Himalaya.</Summary>
    </ComicInfo>`;

  const cbzBuf = armarZip([
    { nombre: "__MACOSX/._page_0.png", datos: imgPagina10 },
    { nombre: "page_10.jpg", datos: imgPagina10 },
    { nombre: "page_2.png", datos: imgPagina2 },
    { nombre: "ComicInfo.xml", datos: comicInfo },
  ]);

  const metaCbz = await extraerMetadatosLibro(cbzBuf, "cbz", "tintin.cbz");
  assert.equal(metaCbz.titulo, "Tintín en el Tíbet");
  assert.equal(metaCbz.autor, "Hergé");
  assert.equal(metaCbz.sinopsis, "Aventura en las montañas del Himalaya.");
  assert.deepEqual(metaCbz.portada, imgPagina2); // page_2 antes que page_10 y sin tomar __MACOSX

  // CBR real (contenedor RAR 4.x)
  const cbrBuf = armarRar4Store([
    { nombre: "ComicInfo.xml", datos: Buffer.from(comicInfo, "utf8") },
    { nombre: "001.png", datos: imgPagina2 },
  ]);
  const metaCbr = await extraerMetadatosLibro(cbrBuf, "cbr", "tintin.cbr");
  assert.equal(metaCbr.titulo, "Tintín en el Tíbet");
  assert.equal(metaCbr.autor, "Hergé");
  assert.ok(esImagenBuffer(metaCbr.portada));

  // CBZ con comentario ComicBookInfo JSON cuando no hay ComicInfo.xml
  const cbiComment = JSON.stringify({
    "ComicBookInfo/1.0": {
      series: "Astérix",
      issue: 1,
      credits: [{ person: "René Goscinny", role: "Writer" }],
      comments: "Aldea gala.",
    },
  });
  const cbzCbi = armarZip([{ nombre: "01.jpg", datos: imgPagina10 }], cbiComment);
  const metaCbi = await extraerMetadatosLibro(cbzCbi, "cbz", "asterix.cbz");
  assert.equal(metaCbi.titulo, "Astérix #1");
  assert.equal(metaCbi.autor, "René Goscinny");
  assert.equal(metaCbi.sinopsis, "Aldea gala.");
  assert.ok(esImagenBuffer(metaCbi.portada));
});
