// Libros de la Biblia que usa el reposo: código (el de la Vulgata de VulSearch/BibleGet), nombre en español
// (Torres Amat) y dónde está cada libro en el OCR de la edición ilustrada de 1883-84 (renglones del archivo AI15x).
export type Libro = {
  codigo: string;
  nombre: string;
  /** Archivo de Internet Archive (AI156…AI159) y rango de renglones [ini, fin) donde está el libro. */
  archivo?: string;
  ini?: number;
  fin?: number;
};

export const LIBROS: Libro[] = [
  { codigo: "Gn", nombre: "Génesis", archivo: "AI156", ini: 314, fin: 9499 },
  { codigo: "Ex", nombre: "Éxodo", archivo: "AI156", ini: 9499, fin: 16637 },
  { codigo: "Dt", nombre: "Deuteronomio", archivo: "AI156", ini: 29662, fin: 36796 },
  { codigo: "Jos", nombre: "Josué", archivo: "AI156", ini: 36796, fin: 41755 },
  { codigo: "1Rg", nombre: "1 Reyes", archivo: "AI157", ini: 60, fin: 5111 },
  { codigo: "Tob", nombre: "Tobías", archivo: "AI157", ini: 30985, fin: 32618 },
  { codigo: "Job", nombre: "Job", archivo: "AI157", ini: 36500, fin: 41800 },
  { codigo: "Ps", nombre: "Salmo", archivo: "AI158", ini: 150, fin: 11979 },
  { codigo: "Pr", nombre: "Proverbios", archivo: "AI158", ini: 11979, fin: 16039 },
  { codigo: "Ecl", nombre: "Eclesiastés", archivo: "AI158", ini: 16039, fin: 17704 },
  { codigo: "Ct", nombre: "Cantar de los Cantares", archivo: "AI158", ini: 17704, fin: 18681 },
  { codigo: "Sap", nombre: "Sabiduría", archivo: "AI158", ini: 18681, fin: 21349 },
  { codigo: "Sir", nombre: "Eclesiástico", archivo: "AI158", ini: 21349, fin: 29800 },
  { codigo: "Is", nombre: "Isaías", archivo: "AI158", ini: 29800, fin: 39300 },
  { codigo: "Jr", nombre: "Jeremías", archivo: "AI158", ini: 39300, fin: 49320 },
  { codigo: "Lam", nombre: "Lamentaciones", archivo: "AI158", ini: 49320, fin: 50077 },
  { codigo: "2Mcc", nombre: "2 Macabeos", archivo: "AI158", ini: 75465, fin: 100000 },
  { codigo: "Mt", nombre: "San Mateo", archivo: "AI159", ini: 560, fin: 6462 },
  { codigo: "Mc", nombre: "San Marcos", archivo: "AI159", ini: 6462, fin: 9978 },
  { codigo: "Lc", nombre: "San Lucas", archivo: "AI159", ini: 9978, fin: 16010 },
  { codigo: "Jo", nombre: "San Juan", archivo: "AI159", ini: 16010, fin: 20807 },
  { codigo: "Act", nombre: "Hechos de los Apóstoles", archivo: "AI159", ini: 20807, fin: 27227 },
  { codigo: "Rom", nombre: "Romanos", archivo: "AI159", ini: 27227, fin: 30396 },
  { codigo: "1Cor", nombre: "1 Corintios", archivo: "AI159", ini: 30396, fin: 33425 },
  { codigo: "2Cor", nombre: "2 Corintios", archivo: "AI159", ini: 33425, fin: 35750 },
  { codigo: "Gal", nombre: "Gálatas", archivo: "AI159", ini: 35750, fin: 37002 },
  { codigo: "Eph", nombre: "Efesios", archivo: "AI159", ini: 37002, fin: 37946 },
  { codigo: "Phlp", nombre: "Filipenses", archivo: "AI159", ini: 37946, fin: 38607 },
  { codigo: "Col", nombre: "Colosenses", archivo: "AI159", ini: 38607, fin: 39273 },
  { codigo: "1Thes", nombre: "1 Tesalonicenses", archivo: "AI159", ini: 39273, fin: 39832 },
  { codigo: "2Thes", nombre: "2 Tesalonicenses", archivo: "AI159", ini: 39832, fin: 40164 },
  { codigo: "1Tim", nombre: "1 Timoteo", archivo: "AI159", ini: 40164, fin: 40939 },
  { codigo: "2Tim", nombre: "2 Timoteo", archivo: "AI159", ini: 40939, fin: 41475 },
  { codigo: "Tit", nombre: "Tito", archivo: "AI159", ini: 41475, fin: 42004 },
  { codigo: "Hbr", nombre: "Hebreos", archivo: "AI159", ini: 42004, fin: 44430 },
  { codigo: "Jac", nombre: "Santiago", archivo: "AI159", ini: 44430, fin: 45432 },
  { codigo: "1Ptr", nombre: "1 San Pedro", archivo: "AI159", ini: 45432, fin: 46243 },
  { codigo: "2Ptr", nombre: "2 San Pedro", archivo: "AI159", ini: 46243, fin: 46775 },
  { codigo: "1Jo", nombre: "1 San Juan", archivo: "AI159", ini: 46775, fin: 48128 },
  { codigo: "Apc", nombre: "Apocalipsis", archivo: "AI159", ini: 48128, fin: 51200 },
];

export const NOMBRE_LIBRO = new Map(LIBROS.map((l) => [l.codigo, l.nombre]));
