-- 18 tareas Unica de Juan (id 3) creadas por Papá (id 1): pendientes de hoy, 1 en revisión (para la 268), 1 en curso pausable (263)
DELETE FROM "Tareas" WHERE "Asignado_ID" = 3;
INSERT INTO "Tareas" ("Titulo","Creador_ID","Asignado_ID","Tiempo_Ejecucion_Estimado_Segundos","Fecha_Vencimiento","Hora_Ejecucion","estado","Genera_Puntos_Y_Recompensa","Puntos_Generados")
SELECT 'Tarea de prueba ' || g, 1, 3, 900, date_trunc('day', now()) + interval '23 hours', date_trunc('day', now()) + (g || ' minutes')::interval * 40, 'Pendiente', true, 0
FROM generate_series(1,16) g;
INSERT INTO "Tareas" ("Titulo","Creador_ID","Asignado_ID","Tiempo_Ejecucion_Estimado_Segundos","Fecha_Vencimiento","estado","Genera_Puntos_Y_Recompensa","Puntos_Generados","Fecha_Completado")
VALUES ('Ordenar el cuarto (en revisión)', 1, 3, 1200, date_trunc('day', now()) + interval '23 hours', 'Esperando_Aprobacion', true, 10, now());
INSERT INTO "Tareas" ("Titulo","Creador_ID","Asignado_ID","Tiempo_Ejecucion_Estimado_Segundos","Fecha_Vencimiento","estado","Timer_Started_At")
VALUES ('Leer 20 minutos (en curso)', 1, 3, 1200, date_trunc('day', now()) + interval '23 hours', 'En progreso', now() - interval '5 minutes');
UPDATE "Usuarios" SET "Locked_Points" = 10 WHERE id = 3;
