#!/usr/bin/env python3
"""Quita el fondo de imágenes en local con rembg (modelo ONNX en esta máquina: sin APIs, sin servicios externos ni modelos de lenguaje).

Uso:
  scripts/quitar-fondo.py <archivo|carpeta> [...] -o <carpeta de salida> [--modelo u2net] [--solo-figura] [--rehacer]

- Acepta JPG, JPEG, PNG y WEBP; las carpetas se recorren enteras y se conserva su estructura dentro de la salida.
- Guarda siempre PNG con transparencia, en la carpeta de salida: los originales nunca se tocan (se rechaza una
  salida que pise un original o que esté dentro de una carpeta de entrada). Si el PNG de salida ya existe se saltea, salvo con --rehacer.
- El modelo se carga una sola vez y se reutiliza para todas las imágenes del lote.
- Con --solo-figura se descarta lo que quede suelto (cartelitos de texto, manchas): solo se conserva la figura más grande
  y lo que esté pegado a ella (a menos de ~1,5 % del lado mayor: la aureola o una espada siguen).
- Cada PNG generado se vuelve a abrir y se verifica: formato PNG válido, canal alfa, y que haya a la vez píxeles
  transparentes y opacos (una salida toda opaca o toda vacía cuenta como error). Sale con código 1 si algo falló.

Instalación (una vez):  python3 -m venv .venv-rembg && .venv-rembg/bin/pip install -r scripts/requirements-rembg.txt
La primera vez rembg baja el modelo (~170 MB) a ~/.local/share/rembg; después funciona sin conexión.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

EXTENSIONES = {".jpg", ".jpeg", ".png", ".webp"}
MODELO_POR_DEFECTO = "u2net"  # recorta bien figuras claras (ángel, hábito) y no deja cartelitos de texto como isnet


def reunir(entradas: list[Path]) -> list[tuple[Path, Path]]:
    """(archivo, ruta relativa dentro de la salida) de todo lo que hay que procesar"""
    lote: list[tuple[Path, Path]] = []
    for e in entradas:
        if e.is_dir():
            lote += [(f, f.relative_to(e)) for f in sorted(e.rglob("*")) if f.is_file() and f.suffix.lower() in EXTENSIONES]
        elif e.is_file() and e.suffix.lower() in EXTENSIONES:
            lote.append((e, Path(e.name)))
        else:
            print(f"Se saltea (no existe o no es JPG/JPEG/PNG/WEBP): {e}", file=sys.stderr)
    return lote


def solo_figura(imagen):
    """Deja solo la figura principal: el resto de las zonas opacas, si no están pegadas a ella, se vuelven transparentes"""
    import numpy as np
    from scipy import ndimage
    from PIL import Image

    rgba = np.array(imagen.convert("RGBA"))
    opaco = rgba[..., 3] > 20
    cerca = ndimage.binary_dilation(opaco, iterations=max(4, round(max(opaco.shape) * 0.015)))
    zonas, cuantas = ndimage.label(cerca)
    if cuantas > 1:
        mayor = 1 + int(np.argmax(ndimage.sum(opaco, zonas, range(1, cuantas + 1))))
        rgba[zonas != mayor, 3] = 0
    return Image.fromarray(rgba, "RGBA")


def verificar(ruta: Path) -> str | None:
    """None si el PNG es válido y tiene alfa útil; si no, el motivo"""
    from PIL import Image

    try:
        with Image.open(ruta) as im:
            im.verify()
        with Image.open(ruta) as im:
            if im.format != "PNG":
                return f"no es PNG ({im.format})"
            if im.mode != "RGBA":
                return f"sin canal alfa (modo {im.mode})"
            minimo, maximo = im.getchannel("A").getextrema()
    except Exception as e:  # archivo corrupto o ilegible
        return f"no se pudo abrir: {e}"
    if maximo == 0:
        return "queda totalmente transparente"
    if minimo == 255:
        return "no se quitó nada (todo opaco)"
    return None


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Quita el fondo con rembg, en local y por lotes.")
    ap.add_argument("entradas", nargs="+", type=Path, help="archivos o carpetas con imágenes")
    ap.add_argument("-o", "--salida", required=True, type=Path, help="carpeta donde se guardan los PNG transparentes")
    ap.add_argument("--modelo", default=MODELO_POR_DEFECTO, help=f"modelo de rembg (por defecto {MODELO_POR_DEFECTO})")
    ap.add_argument("--solo-figura", action="store_true", help="descartar lo suelto que no esté pegado a la figura principal (cartelitos, manchas)")
    ap.add_argument("--rehacer", action="store_true", help="volver a generar los PNG que ya existen en la salida")
    args = ap.parse_args(argv)

    salida = args.salida.resolve()
    lote = reunir([e.resolve() for e in args.entradas])
    if not lote:
        print("No hay imágenes para procesar.", file=sys.stderr)
        return 1
    originales = {f.resolve() for f, _ in lote}
    for e in args.entradas:
        e = e.resolve()
        if e.is_dir() and (salida == e or e in salida.parents):
            print(f"Rechazado: la salida ({salida}) está dentro de la carpeta de entrada ({e}). Usá otra carpeta con -o.", file=sys.stderr)
            return 2
    for _, rel in lote:
        if (salida / rel).with_suffix(".png").resolve() in originales:
            print(f"Rechazado: la salida pisaría un original ({(salida / rel).with_suffix('.png')}). Usá otra carpeta con -o.", file=sys.stderr)
            return 2

    from PIL import Image
    from rembg import new_session, remove

    sesion = new_session(args.modelo)  # una sola carga para todo el lote
    hechas = salteadas = 0
    fallos: list[str] = []
    for origen, rel in lote:
        destino = (salida / rel).with_suffix(".png")
        if destino.exists() and not args.rehacer:
            salteadas += 1
            continue
        destino.parent.mkdir(parents=True, exist_ok=True)
        try:
            with Image.open(origen) as im:
                resultado = remove(im.convert("RGB"), session=sesion)
            if args.solo_figura:
                resultado = solo_figura(resultado)
            resultado.save(destino, format="PNG")
        except Exception as e:
            fallos.append(f"{origen}: {e}")
            continue
        motivo = verificar(destino)
        if motivo:
            fallos.append(f"{destino}: {motivo}")
            destino.unlink(missing_ok=True)
            continue
        hechas += 1
        print(f"✓ {origen.name} → {destino}")

    print(f"{hechas} listas, {salteadas} ya estaban, {len(fallos)} con error (de {len(lote)}).")
    for f in fallos:
        print(f"✗ {f}", file=sys.stderr)
    return 1 if fallos else 0


if __name__ == "__main__":
    sys.exit(main())
