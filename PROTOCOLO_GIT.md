# Protocolo de trabajo con Git

## Objetivo
Trabajar en paralelo sin sobrescribir cambios de otros desarrolladores y mantener `dev` estable.

## Reglas obligatorias

1. Nunca trabajar directamente en `main` ni en `dev`.
2. Crear una rama por funcionalidad, corrección o tarea.
3. Actualizar `dev` antes de crear una rama nueva.
4. Subir los cambios a la rama propia, nunca directamente a `dev`.
5. Integrar el trabajo mediante Pull Requests hacia `dev`.
6. Revisar y probar los cambios antes de aprobar un PR.
7. Si `dev` recibe cambios nuevos, incorporarlos a la rama propia cuando sea necesario.
8. No sobrescribir cambios de compañeros ni resolver conflictos sin revisar ambas versiones.
9. No subir archivos `.env`, credenciales, claves privadas ni otros secretos.
10. Mantener los PR pequeños y limitados a una funcionalidad.

## Flujo de comandos

```bash
# 1. Actualizar dev
git switch dev
git pull --ff-only origin dev

# 2. Crear una rama propia
git switch -c feature/nombre-tarea

# 3. Trabajar y guardar cambios
git add .
git commit -m "feat: descripcion del cambio"

# 4. Publicar la rama
git push -u origin feature/nombre-tarea
```

Después, abrir un Pull Request desde `feature/nombre-tarea` hacia `dev`.

Cuando el PR sea aprobado y se integre, actualizar la copia local:

```bash
git switch dev
git pull --ff-only origin dev
```

Para comenzar otra tarea, crear una nueva rama desde `dev` actualizado.

## Comunicación del equipo

Antes de trabajar en una funcionalidad, informar qué módulo o archivos se modificarán. Si dos tareas necesitan cambiar el mismo archivo, acordar las modificaciones antes de integrar los PR.

**Regla final:** cada persona desarrolla en su rama; `dev` recibe únicamente cambios revisados e integrados mediante PR.
