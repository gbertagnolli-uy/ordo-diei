import { test } from "node:test";
import assert from "node:assert/strict";
import { generarTareasRecurrentes } from "./generarRecurrentes.ts";
import { esTareaVisibleParaUsuarioEnDia, type RotacionConfig } from "./rotacionTarea.ts";

function crearMockPrisma(iniciales: any[]) {
  const tareas = [...iniciales];
  let nextId = Math.max(100, ...tareas.map((t) => Number(t.id) || 0)) + 1;

  const prismaMock: any = {
    tareas,
    tarea: {
      findMany: async ({ where }: any) => {
        return tareas.filter((t) => {
          if (where?.tipoRecurrencia?.not && t.tipoRecurrencia === where.tipoRecurrencia.not) return false;
          if (where?.generadaPorCron !== undefined && Boolean(t.generadaPorCron) !== where.generadaPorCron) return false;
          return true;
        });
      },
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        for (const t of tareas) {
          const matchOr =
            !where?.OR ||
            where.OR.some((cond: any) => {
              if (cond.id !== undefined) return t.id === cond.id;
              if (cond.parentTaskId !== undefined) return t.parentTaskId === cond.parentTaskId;
              return false;
            });
          if (!matchOr) continue;
          if (where?.fechaVencimiento?.lt) {
            if (!t.fechaVencimiento || new Date(t.fechaVencimiento) >= where.fechaVencimiento.lt) continue;
          }
          if (where?.estado?.in && !where.estado.in.includes(t.estado)) continue;
          Object.assign(t, data);
          count++;
        }
        return { count };
      },
      findFirst: async ({ where }: any) => {
        return (
          tareas.find((t) => {
            if (where?.fechaVencimiento) {
              if (!t.fechaVencimiento) return false;
              const fv = new Date(t.fechaVencimiento);
              if (where.fechaVencimiento.gte && fv < where.fechaVencimiento.gte) return false;
              if (where.fechaVencimiento.lt && fv >= where.fechaVencimiento.lt) return false;
            }
            if (where?.estado?.notIn && where.estado.notIn.includes(t.estado)) return false;
            if (where?.estado?.in && !where.estado.in.includes(t.estado)) return false;
            if (where?.asignadoId !== undefined && t.asignadoId !== where.asignadoId) return false;
            if (where?.parentTaskId !== undefined && t.parentTaskId !== where.parentTaskId) return false;
            if (where?.OR) {
              const ok = where.OR.some((cond: any) => {
                if (cond.id !== undefined) return t.id === cond.id;
                if (cond.parentTaskId !== undefined) return t.parentTaskId === cond.parentTaskId;
                if (cond.asignadoId !== undefined && cond.titulo?.equals) {
                  return (
                    t.asignadoId === cond.asignadoId &&
                    String(t.titulo).toLowerCase() === String(cond.titulo.equals).toLowerCase()
                  );
                }
                return false;
              });
              if (!ok) return false;
            }
            return true;
          }) ?? null
        );
      },
      create: async ({ data }: any) => {
        const nueva = { id: nextId++, ...data };
        tareas.push(nueva);
        return nueva;
      },
    },
    checklistItem: {
      findMany: async () => [],
      createMany: async () => ({ count: 0 }),
    },
  };

  return prismaMock;
}

test("generarTareasRecurrentes rota responsable día por día y cierra turnos pasados no realizados", async () => {
  const rotacion: RotacionConfig = {
    modo: "frecuencia",
    responsablesIds: [1, 2, 3],
    cada: 1,
    unidad: "dias",
    fechaInicio: "2026-10-12", // Lunes 12 -> usuario 1
  };

  const lunes = new Date(2026, 9, 12, 0, 0, 0);
  const martes = new Date(2026, 9, 13, 10, 0, 0);
  const miercoles = new Date(2026, 9, 14, 10, 0, 0);

  const reglaInicial = {
    id: 1,
    titulo: "Lavar los platos",
    descripcion: "Después de cenar",
    creadorId: 99,
    asignadoId: 1,
    tiempoEjecucionEstimadoSeg: 900,
    generaPuntosYRecompensa: true,
    dificultad: "Media",
    tipoRecurrencia: "Diaria",
    fechaVencimiento: lunes,
    horaEjecucion: new Date(2026, 9, 12, 21, 0, 0),
    estado: "Pendiente",
    generadaPorCron: false,
    rotacionConfig: rotacion,
  };

  const mock = crearMockPrisma([reglaInicial]);

  // El lunes ya existe la regla para hoy: no duplica
  const genLunes = await generarTareasRecurrentes(mock, new Date(2026, 9, 12, 9, 0, 0));
  assert.equal(genLunes, 0);

  // El martes: cierra el turno del lunes (usuario 1) y crea instancia para el usuario 2
  const genMartes = await generarTareasRecurrentes(mock, martes);
  assert.equal(genMartes, 1);
  assert.equal(mock.tareas[0].estado, "No_Realizada");
  assert.equal(mock.tareas[1].asignadoId, 2);

  // El martes solo el usuario 2 tiene una tarea visible activa
  const visiblesU1Martes = mock.tareas.filter((t: any) => esTareaVisibleParaUsuarioEnDia(t, 1, martes) && t.estado === "Pendiente");
  const visiblesU2Martes = mock.tareas.filter((t: any) => esTareaVisibleParaUsuarioEnDia(t, 2, martes) && t.estado === "Pendiente");
  const visiblesU3Martes = mock.tareas.filter((t: any) => esTareaVisibleParaUsuarioEnDia(t, 3, martes) && t.estado === "Pendiente");
  assert.equal(visiblesU1Martes.length, 0);
  assert.equal(visiblesU2Martes.length, 1);
  assert.equal(visiblesU3Martes.length, 0);

  // Idempotencia: volver a correr el martes no duplica
  const genMartes2 = await generarTareasRecurrentes(mock, martes);
  assert.equal(genMartes2, 0);

  // El miércoles: le toca al usuario 3
  const genMiercoles = await generarTareasRecurrentes(mock, miercoles);
  assert.equal(genMiercoles, 1);
  assert.equal(mock.tareas[2].asignadoId, 3);
});

test("las instancias recurrentes heredan la foto de prueba obligatoria sin copiar la foto anterior", async () => {
  const ayer = new Date(2026, 9, 11, 0, 0, 0);
  const hoy = new Date(2026, 9, 12, 9, 0, 0);
  const regla = {
    id: 70,
    titulo: "Ordenar la pieza",
    descripcion: null,
    creadorId: 1,
    asignadoId: 5,
    tiempoEjecucionEstimadoSeg: 900,
    generaPuntosYRecompensa: true,
    dificultad: "Media",
    tipoRecurrencia: "Diaria",
    fechaVencimiento: ayer,
    horaEjecucion: new Date(2026, 9, 11, 19, 0, 0),
    estado: "Pendiente",
    generadaPorCron: false,
    intervalo: 1,
    anclaCompletado: false,
    requiereFotoPrueba: true,
    fotoPruebaUrl: "/api/archivos/foto-de-ayer",
  };

  const mock = crearMockPrisma([regla]);
  const generadas = await generarTareasRecurrentes(mock, hoy);
  assert.equal(generadas, 1);

  const nueva = mock.tareas.find((t: any) => t.parentTaskId === regla.id);
  assert.ok(nueva);
  assert.equal(nueva.requiereFotoPrueba, true);
  assert.equal(nueva.fotoPruebaUrl, undefined);
});

test("generarTareasRecurrentes genera tareas para múltiples responsables el mismo día (tareas en grupo)", async () => {
  const rotacionGrupal: RotacionConfig = {
    modo: "dias_semana",
    responsablesIds: [10, 20],
    diasPorUsuario: {
      "10": [1], // Lunes
      "20": [1], // Lunes (¡ambos el lunes!)
    },
    fechaInicio: "2026-10-12",
  };

  const lunes = new Date(2026, 9, 12, 10, 0, 0);

  const reglaGrupal = {
    id: 50,
    titulo: "Ordenar garage",
    descripcion: "Tarea en equipo",
    creadorId: 1,
    asignadoId: 10,
    tiempoEjecucionEstimadoSeg: 1800,
    generaPuntosYRecompensa: true,
    dificultad: "Exigente",
    tipoRecurrencia: "Diaria",
    fechaVencimiento: lunes,
    horaEjecucion: new Date(2026, 9, 12, 18, 0, 0),
    estado: "Pendiente",
    generadaPorCron: false,
    rotacionConfig: rotacionGrupal,
  };

  // La regla inicial ya está para el usuario 10. Al correr el cron, debe crear la instancia para el usuario 20.
  const mock = crearMockPrisma([reglaGrupal]);
  const genLunes = await generarTareasRecurrentes(mock, lunes);
  assert.equal(genLunes, 1);

  // Ahora ambos tienen tarea activa para el lunes
  const tareasLunes = mock.tareas.filter((t: any) => t.estado === "Pendiente");
  assert.equal(tareasLunes.length, 2);
  const asignados = tareasLunes.map((t: any) => t.asignadoId).sort();
  assert.deepEqual(asignados, [10, 20]);

  // Idempotente: volver a correr no duplica para ninguno
  const genLunes2 = await generarTareasRecurrentes(mock, lunes);
  assert.equal(genLunes2, 0);
});

