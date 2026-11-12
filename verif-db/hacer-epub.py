# Arma un ePub mínimo de prueba (lane 270): python hacer-epub.py <salida.epub> "<título>"  — 6 capítulos largos.
import sys, zipfile
salida, titulo = sys.argv[1], sys.argv[2]
caps = [(f"c{i}", f"Capítulo {i}", " ".join([f"Texto de prueba del capítulo {i}, párrafo número {j}." for j in range(1, 120)])) for i in range(1, 7)]
with zipfile.ZipFile(salida, "w") as z:
    z.writestr(zipfile.ZipInfo("mimetype"), "application/epub+zip", compress_type=zipfile.ZIP_STORED)
    z.writestr("META-INF/container.xml", '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>')
    manifest = "".join(f'<item id="{c}" href="{c}.xhtml" media-type="application/xhtml+xml"/>' for c, _, _ in caps)
    spine = "".join(f'<itemref idref="{c}"/>' for c, _, _ in caps)
    z.writestr("OEBPS/content.opf", f'<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>{titulo}</dc:title><dc:language>es</dc:language><dc:identifier id="id">prueba-270</dc:identifier></metadata><manifest><item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>{manifest}</manifest><spine toc="ncx">{spine}</spine></package>')
    nav = "".join(f'<navPoint id="n{c}" playOrder="{i+1}"><navLabel><text>{t}</text></navLabel><content src="{c}.xhtml"/></navPoint>' for i, (c, t, _) in enumerate(caps))
    z.writestr("OEBPS/toc.ncx", f'<?xml version="1.0"?><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="prueba-270"/></head><docTitle><text>{titulo}</text></docTitle><navMap>{nav}</navMap></ncx>')
    for c, t, texto in caps:
        z.writestr(f"OEBPS/{c}.xhtml", f'<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>{t}</title></head><body><h1>{t}</h1><p>{texto}</p><p>{texto}</p></body></html>')
print(salida)
