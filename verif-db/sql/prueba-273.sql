-- Datos de prueba de la lane 273 (SOLO base local de verificación). Hora en UTC = local Uruguay + 3.
INSERT INTO "Tareas" ("Titulo","Descripcion","Creador_ID","Asignado_ID","Tiempo_Ejecucion_Estimado_Segundos","Tipo_Recurrencia","Intervalo","Fecha_Vencimiento","Hora_Ejecucion","Ancla_Fecha")
VALUES ('P273 Rezar el Ángelus', NULL, 1, 3, 600, 'Diaria', 1, '2026-11-02 15:00:00', '2026-11-02 15:00:00', '2026-11-02 15:00:00');
INSERT INTO "Tareas" ("Titulo","Descripcion","Creador_ID","Asignado_ID","Tiempo_Ejecucion_Estimado_Segundos","Tipo_Recurrencia","Fecha_Vencimiento","Hora_Ejecucion","Is_Checklist")
VALUES ('P273 Ordenar el cuarto', E'Guardar la ropa limpia\nVaciar la mochila', 1, 3, 1800, 'Unica', '2026-11-04 20:30:00', '2026-11-04 20:30:00', true);
INSERT INTO "Checklist_Items" ("Tarea_ID","texto","orden") SELECT id, 'Tender la cama', 0 FROM "Tareas" WHERE "Titulo"='P273 Ordenar el cuarto';
INSERT INTO "Checklist_Items" ("Tarea_ID","texto","orden") SELECT id, 'Barrer', 1 FROM "Tareas" WHERE "Titulo"='P273 Ordenar el cuarto';
INSERT INTO "Tareas" ("Titulo","Creador_ID","Asignado_ID","Tiempo_Ejecucion_Estimado_Segundos","Tipo_Recurrencia","Fecha_Vencimiento","Hora_Ejecucion","Rotacion_Config")
VALUES ('P273 Sacar la basura (rotativa)', 1, 3, 300, 'Diaria', '2026-11-02 11:00:00', '2026-11-02 11:00:00', '{"modo":"dias_semana","responsablesIds":[3,4],"diasPorUsuario":{"3":[1,3,5],"4":[2,4,6]},"fechaInicio":"2026-11-02"}');
INSERT INTO "Tareas" ("Titulo","Creador_ID","Asignado_ID","Tiempo_Ejecucion_Estimado_Segundos","Tipo_Recurrencia","Fecha_Vencimiento","Hora_Ejecucion")
VALUES ('P273 Tarea de Ana (no debe salir)', 1, 4, 600, 'Unica', '2026-11-05 13:00:00', '2026-11-05 13:00:00');
