"use client";

import { useEffect, useRef } from "react";
import { ActivityCalendar } from "react-activity-calendar";
import "react-activity-calendar/tooltips.css";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useThemeStore } from "@/store/themeStore";
import type { EstadoHabito } from "@/lib/habitos/server";

const DIAS = 182;
// Rampa secuencial de un solo tono (validada): celda vacía + 1, 2 y 3+ hábitos cumplidos
const TEMA = {
  light: ["#EDE6DA", "#C49A6C", "#8A5A2B", "#502300"],
  dark: ["#3A2F22", "#6B5236", "#9C7650", "#D8AE82"],
};
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS_SEMANA = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

export function CalendarioHabitos({ habitos, hoy }: { habitos: EstadoHabito[]; hoy: string }) {
  const darkMode = useThemeStore((s) => s.darkMode);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const raiz = ref.current;
    if (!raiz) return;
    const alFinal = () =>
      raiz.querySelectorAll<HTMLElement>("*").forEach((el) => {
        if (el.scrollWidth > el.clientWidth) el.scrollLeft = el.scrollWidth;
      });
    const observer = new ResizeObserver(alFinal);
    observer.observe(raiz);
    return () => observer.disconnect();
  }, []);

  const hechos = new Map<string, number>();
  for (const h of habitos) {
    for (const p of h.trayectoria) {
      if (p.marca === "hecho") {
        hechos.set(p.fecha, (hechos.get(p.fecha) ?? 0) + 1);
      }
    }
  }

  const desde = addDays(parseISO(hoy), -(DIAS - 1));
  const data = Array.from({ length: differenceInCalendarDays(parseISO(hoy), desde) + 1 }, (_, i) => {
    const date = format(addDays(desde, i), "yyyy-MM-dd");
    const count = hechos.get(date) ?? 0;
    return { date, count, level: Math.min(3, count) };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Constancia diaria</CardTitle>
        <CardDescription>
          Cada cuadro representa un día en los últimos 6 meses. Más oscuro indica más hábitos realizados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ActivityCalendar
          ref={ref}
          data={data}
          maxLevel={3}
          weekStart={1}
          blockSize={13}
          blockMargin={3}
          blockRadius={3}
          fontSize={12}
          colorScheme={darkMode ? "dark" : "light"}
          theme={TEMA}
          showWeekdayLabels={["mon", "wed", "fri"]}
          labels={{
            months: MESES,
            weekdays: DIAS_SEMANA,
            totalCount: "{{count}} hábitos cumplidos en los últimos 6 meses",
            legend: { less: "Menos", more: "Más" },
          }}
          tooltips={{
            activity: {
              text: (a) =>
                `${format(parseISO(a.date), "EEEE d 'de' MMMM", { locale: es })}: ${a.count} ${
                  a.count === 1 ? "hábito" : "hábitos"
                }`,
            },
          }}
        />
      </CardContent>
    </Card>
  );
}
