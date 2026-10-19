#!/usr/bin/env bash
# OBSOLETO desde la lane 249. Ya no se integra a dev con merge local: se entrega por Pull Request.
# Ver AGENTS.md. Reemplazos:
#   empezar   -> scripts/nueva-lane.sh NN descripcion
#   entregar  -> scripts/abrir-pr.sh        (desde el worktree de la lane)
#   cerrar    -> scripts/limpiar-lane.sh NN (desde ordo-diei/, cuando el PR ya se integró)
echo "✗ scripts/integrar.sh ya no se usa: no se mergea a dev en local. Usá scripts/abrir-pr.sh (PR a dev). Ver AGENTS.md." >&2
exit 1
