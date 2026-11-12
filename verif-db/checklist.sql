DELETE FROM "Tareas" WHERE "Titulo" LIKE 'Checklist %';
INSERT INTO "Tareas" ("Titulo","Creador_ID","Asignado_ID","Tiempo_Ejecucion_Estimado_Segundos","Fecha_Vencimiento","estado","Is_Checklist","Grupo_Tarea_ID")
VALUES ('Checklist compartida (Juan)',1,3,600,(now() at time zone 'UTC')+interval '10 hours','Pendiente',true,'grupo-prueba-265'),
       ('Checklist compartida (Ana)',1,4,600,(now() at time zone 'UTC')+interval '10 hours','Pendiente',true,'grupo-prueba-265'),
       ('Checklist individual (Juan)',1,3,600,(now() at time zone 'UTC')+interval '10 hours','Pendiente',true,NULL);
INSERT INTO "Checklist_Items" ("Tarea_ID",texto,orden)
SELECT t.id, x.texto, x.orden FROM "Tareas" t CROSS JOIN (VALUES ('Tender la cama',0),('Juntar la ropa',1),('Barrer',2)) x(texto,orden) WHERE t."Titulo" LIKE 'Checklist %';
