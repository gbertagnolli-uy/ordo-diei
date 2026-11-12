// Genera sembrar.sql: familia de prueba (PIN 1234 para todos). Solo para la base local.
import bcrypt from "../ordo-diei/node_modules/bcryptjs/index.js";
import { writeFileSync } from "node:fs";
const h = bcrypt.hashSync("1234", 10);
const u = [["Papá Prueba","Padre","1985-03-10",0],["Mamá Prueba","Madre","1987-07-22",0],["Juan Prueba","Hijo","2014-05-02",500],["Ana Prueba","Hija","2016-09-15",300]];
const sql = `TRUNCATE "Usuarios" RESTART IDENTITY CASCADE;\n` + u.map(([n,r,f,p]) =>
  `INSERT INTO "Usuarios" (nombre,"PIN_Secreto","Fecha_Nacimiento","Rol_Familiar","Available_Points") VALUES ('${n}','${h}','${f}','${r}',${p});`).join("\n");
writeFileSync(new URL("./sembrar.sql", import.meta.url), sql);
console.log("ok");
