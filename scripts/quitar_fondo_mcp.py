#!/usr/bin/env python3
"""Herramienta MCP para Claude Code: quita el fondo de una imagen o de una carpeta con scripts/quitar-fondo.py (rembg, local).

Alta (una vez, con el venv de scripts/requirements-rembg.txt):
  claude mcp add quitar-fondo -- .venv-rembg/bin/python scripts/quitar_fondo_mcp.py
"""
import contextlib
import io
from pathlib import Path

from mcp.server.fastmcp import FastMCP

import importlib.util

_spec = importlib.util.spec_from_file_location("quitar_fondo", Path(__file__).with_name("quitar-fondo.py"))
quitar_fondo = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(quitar_fondo)

mcp = FastMCP("quitar-fondo")


@mcp.tool()
def quitar_fondo_imagenes(ruta: str, salida: str, modelo: str = quitar_fondo.MODELO_POR_DEFECTO, solo_figura: bool = False, rehacer: bool = False) -> str:
    """Quita el fondo (local, rembg) de una imagen o de todas las de una carpeta y guarda PNG transparentes en `salida`.
    `solo_figura` descarta cartelitos y manchas sueltas. Nunca toca los originales; verifica que cada PNG tenga canal alfa."""
    out, err = io.StringIO(), io.StringIO()
    argv = [ruta, "-o", salida, "--modelo", modelo] + (["--solo-figura"] if solo_figura else []) + (["--rehacer"] if rehacer else [])
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        codigo = quitar_fondo.main(argv)
    return f"código {codigo}\n{out.getvalue()}{err.getvalue()}".strip()


if __name__ == "__main__":
    mcp.run()
