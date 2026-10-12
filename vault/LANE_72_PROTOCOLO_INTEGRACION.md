# Lane 72 — Protocolo de integración a dev

Pedido (textual): "deja documentado para otros agentes, que tengan cuidado conel merge a dev, por que hay varis trabajando en simultaneo y temo que se pueda sobreescribir trabajo. Establece alguna modalidad de trabajo que impida que un agente sobreescriba el trabajo de otro sin tener que estar diciendole o sin tener que trabajar en orden de lane."

## Solución
- `scripts/integrar.sh`: único camino permitido para llegar a `dev` (ver `AGENTS.md`, regla 4).
  - Lock en `.git/integrar.lock` (mkdir atómico, detecta locks huérfanos por PID) → un integrador a la vez, en cualquier orden.
  - Trae `dev` a la lane antes de mergear: la rama contiene todo `dev`, el merge no puede revertir trabajo ajeno; conflictos se resuelven en la lane.
  - Valida lint + test + tsc con el resultado combinado; aborta si `dev` se movió; verifica que el árbol de `dev` == árbol de la rama.
- `AGENTS.md`: prohibido merge manual en `ordo-diei/`, reescribir historia de `dev`, y descartar líneas ajenas al resolver conflictos.
