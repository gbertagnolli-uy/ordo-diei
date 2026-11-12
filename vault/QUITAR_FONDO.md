# Quitar el fondo de imágenes (local, con rembg)

Parte de la lane 233 ([`LANE_233_HEROES_COMPANEROS.md`](LANE_233_HEROES_COMPANEROS.md)). Pedido del usuario: un flujo local con Python y `rembg`, sin APIs pagas ni servicios externos, sin modelos de lenguaje; acepta JPG/JPEG/PNG/WEBP, guarda PNG transparente, procesa carpetas por lotes, nunca sobrescribe originales, reutiliza el modelo cargado, verifica el canal alfa e, idealmente, se integra como herramienta MCP.

## Instalación (una vez)

```bash
python3 -m venv .venv-rembg
.venv-rembg/bin/pip install -r scripts/requirements-rembg.txt
```

La primera vez `rembg` baja el modelo ONNX (`u2net`, ~170 MB) a `~/.local/share/rembg`; después funciona sin conexión. `.venv-rembg/` está en `.gitignore`.

## Uso

```bash
.venv-rembg/bin/python scripts/quitar-fondo.py <archivo|carpeta> [...] -o <carpeta de salida> [--modelo u2net] [--solo-figura] [--rehacer]
```

- Las carpetas se recorren enteras y su estructura se conserva dentro de la salida. Salida: `<nombre>.png` con transparencia.
- **Originales a salvo**: se rechaza (código 2) una salida que pise un original o que esté dentro de una carpeta de entrada. Si el PNG ya existe se saltea, salvo con `--rehacer`.
- **Un solo modelo cargado** para todo el lote.
- **Verificación**: cada PNG se reabre y se comprueba que sea PNG válido, RGBA, y que tenga a la vez píxeles transparentes y opacos; si no, se borra y cuenta como error (código de salida 1).
- `--solo-figura`: descarta lo suelto que no esté pegado a la figura principal (cartelitos de texto, manchas). La aureola de Angelito y las espadas se conservan. **No se usa en los héroes** (el usuario quiere dejar los «Buenos días» como vienen).
- Modelo: `u2net` (por defecto) recortó mejor que `isnet-general-use` las figuras claras (ángel, hábito blanco) y no dejó restos de los cartelitos de texto.

## Herramienta MCP para Claude Code

`scripts/quitar_fondo_mcp.py` expone la función `quitar_fondo_imagenes(ruta, salida, modelo, solo_figura, rehacer)`. Alta (no queda registrada en el repo, es de cada máquina):

```bash
claude mcp add quitar-fondo -- .venv-rembg/bin/python scripts/quitar_fondo_mcp.py
```

Requiere `mcp<2` (la 2.x cambió la API). Se probó que lista la herramienta y procesa una imagen; no se probó dentro de una sesión de Claude Code con el servidor dado de alta.

## Uso en los compañeros

`npm run heroes -- <carpeta Heroes>` elige las poses de cada héroe, pasa todas por este script en un solo lote y arma `public/companeros/<clave>/<pose>.webp` con transparencia. Si `python3` no tiene rembg: `REMBG_PYTHON=/ruta/al/python npm run heroes -- …` o crear `.venv-rembg` como arriba.
**Excepción pedida por el usuario:** la pose `buenos-dias` (`POSES_CON_FONDO`) no pasa por rembg: se deja con su fondo blanco y su cartel «¡Buenos días!», y la escena le aplica `mix-blend-mode: multiply` para fundir el blanco.
