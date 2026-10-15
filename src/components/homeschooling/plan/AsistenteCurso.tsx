"use client";

// Propio de Ordo: asistente «Nuevo curso» / «Asignar a…» (la spec de H1b lo pide con el Stepper de Ordo; Roost no tiene
// plan por alumno). Pasos: ① materia ② curso ③ alumnos, fechas y días ④ vista previa → crearPlan por alumno.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, BookOpen, Plus } from "lucide-react";
import Stepper, { Step } from "@/components/Stepper";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/homeschooling/roost/services/http";
import { getModulesWithProgress } from "@/lib/homeschooling/roost/services/module";
import type { Group, Module } from "@/lib/homeschooling/roost/tipos";
import type { SalidaPacing } from "@/lib/homeschooling/pacing";
import { toast } from "@/lib/toast";
import CursoForm from "@/components/homeschooling/cursos/CursoForm";
import MateriaForm from "@/components/homeschooling/cursos/MateriaForm";
import type { AlumnoLite } from "@/components/homeschooling/cursos/MateriaHeader";
import { DIAS_SEMANA as DIAS } from "./dias";
import { STEPPER_VARS } from "./stepperVars";


const hoyLocal = () => new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD en la zona del navegador
const finDeAnio = () => `${new Date().getFullYear()}-11-30`;

type Props = {
  open: boolean;
  onClose: () => void;
  alumnos: AlumnoLite[];
  materias: Group[];
  materiaFija?: Group | null;
  cursoFijo?: Module | null;
  onGuardado: () => void;
};

export default function AsistenteCurso({ open, onClose, alumnos, materias, materiaFija, cursoFijo, onGuardado }: Props) {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [lista, setLista] = useState<Group[]>(materias);
  const [materia, setMateria] = useState<Group | null>(materiaFija ?? null);
  const [cursos, setCursos] = useState<Module[]>([]);
  const [curso, setCurso] = useState<Module | null>(cursoFijo ?? null);
  const [elegidos, setElegidos] = useState<number[]>([]);
  const [inicio, setInicio] = useState(hoyLocal());
  const [fin, setFin] = useState(finDeAnio());
  const [dias, setDias] = useState<number[]>([1, 2, 3, 4, 5]);
  const [previas, setPrevias] = useState<Record<number, SalidaPacing | string> | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [formMateria, setFormMateria] = useState(false);
  const [formCurso, setFormCurso] = useState(false);

  // Cada vez que se abre vuelve al principio (o directo a «alumnos» si el curso ya está elegido)
  useEffect(() => {
    if (!open) return;
    setLista(materias);
    setMateria(materiaFija ?? null);
    setCurso(cursoFijo ?? null);
    setPaso(cursoFijo ? 3 : 1);
    setElegidos([]);
    setInicio(hoyLocal());
    setFin(finDeAnio());
    setDias([1, 2, 3, 4, 5]);
    setPrevias(null);
  }, [open, materias, materiaFija, cursoFijo]);

  const cargarCursos = useCallback(async (m: Group) => {
    try {
      setCursos(await getModulesWithProgress(m.id, null));
    } catch {
      setCursos([]);
    }
  }, []);

  useEffect(() => {
    if (open && materia && !cursoFijo) void cargarCursos(materia);
  }, [open, materia, cursoFijo, cargarCursos]);

  const alternar = (id: number) => setElegidos((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));
  const alternarDia = (iso: number) => setDias((d) => (d.includes(iso) ? d.filter((x) => x !== iso) : [...d, iso].sort()));

  const cuerpo = useCallback(
    (alumnoId: number) => ({ recursoId: curso!.id, alumnoId, inicio, fin, diasSemana: dias }),
    [curso, inicio, fin, dias]
  );

  const calcularPrevias = useCallback(async () => {
    if (!curso) return;
    setPrevias(null);
    const salida: Record<number, SalidaPacing | string> = {};
    await Promise.all(
      elegidos.map(async (id) => {
        try {
          salida[id] = await api<SalidaPacing>("/api/homeschooling/planes/vista-previa", { method: "POST", body: cuerpo(id) });
        } catch (e) {
          salida[id] = e instanceof Error ? e.message : "Error";
        }
      })
    );
    setPrevias(salida);
  }, [curso, elegidos, cuerpo]);

  useEffect(() => {
    if (open && paso === 4) void calcularPrevias();
  }, [open, paso, calcularPrevias]);

  const validar = (p: number): string | null => {
    if (p === 1 && !materia) return "Elegí una materia";
    if (p === 2) {
      if (!curso) return "Elegí un curso";
      if (curso.total_unidades < 1) return "El curso todavía no tiene unidades: cargá las lecciones primero";
    }
    if (p === 3) {
      if (elegidos.length === 0) return "Elegí al menos un alumno";
      if (!inicio || !fin || inicio > fin) return "La fecha de inicio tiene que ser anterior a la de fin";
      if (dias.length === 0) return "Elegí al menos un día de la semana";
    }
    if (p === 4) {
      if (!previas) return "Esperá a que se calcule el plan";
      if (Object.values(previas).some((v) => typeof v === "string" || v.aviso?.tipo === "sin_dias")) return "Algún alumno no tiene días lectivos en ese rango";
    }
    return null;
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      for (const id of elegidos) await api("/api/homeschooling/planes", { method: "POST", body: cuerpo(id) });
      toast.success("Plan guardado");
      router.refresh();
      onGuardado();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar el plan");
    } finally {
      setGuardando(false);
    }
  };

  // Aplica la opción del aviso de sobrecarga (los textos los arma repartir())
  const aplicarOpcion = (op: string) => {
    if (op.startsWith("extender hasta ")) setFin(op.replace("extender hasta ", ""));
    else if (op === "sumar el sábado") setDias((d) => [...new Set([...d, 6])].sort());
    else if (op === "sumar el domingo") setDias((d) => [...new Set([...d, 7])].sort());
  };

  const sobrecarga = useMemo(
    () => (previas ? Object.values(previas).find((v): v is SalidaPacing => typeof v !== "string" && v.aviso?.tipo === "sobrecarga") : undefined),
    [previas]
  );

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && !guardando && onClose()}>
        <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{cursoFijo ? `Asignar «${cursoFijo.title}»` : "Nuevo curso"}</DialogTitle>
            <DialogDescription>Elegí qué se estudia, quién y cuándo; el reparto diario se calcula solo.</DialogDescription>
          </DialogHeader>

          <Stepper
            step={paso}
            onStepChange={setPaso}
            linear
            frame={false}
            width="100%"
            style={STEPPER_VARS}
            backButtonText="Atrás"
            nextButtonText="Siguiente"
            completeButtonText={guardando ? "Guardando…" : "Guardar plan"}
            nextButtonProps={{
              disabled: guardando,
              onClick: (e) => {
                const error = validar(paso);
                if (error) {
                  e.preventDefault();
                  toast.error(error);
                } else if (paso === 4) {
                  e.preventDefault();
                  void guardar();
                }
              },
            }}
          >
            <Step title="Materia">
              <div className="space-y-2">
                {lista.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMateria(m);
                      setCurso(null);
                    }}
                    disabled={!!materiaFija}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${materia?.id === m.id ? "border-primary bg-primary/10" : "hover:bg-muted"}`}
                  >
                    <BookOpen className="size-4 text-muted-foreground" /> {m.name}
                  </button>
                ))}
                {!materiaFija && (
                  <Button type="button" variant="outline" onClick={() => setFormMateria(true)}>
                    <Plus /> Nueva materia
                  </Button>
                )}
              </div>
            </Step>

            <Step title="Curso">
              <div className="space-y-2">
                {cursos.length === 0 && <p className="text-sm text-muted-foreground">Esta materia todavía no tiene cursos.</p>}
                {cursos.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCurso(c)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors ${curso?.id === c.id ? "border-primary bg-primary/10" : "hover:bg-muted"}`}
                  >
                    <span className="font-medium">{c.title}</span>
                    <span className="text-xs text-muted-foreground">{c.total_unidades} unidades</span>
                  </button>
                ))}
                {curso && curso.total_unidades < 1 && (
                  <p className="flex items-center gap-2 text-sm text-warning">
                    <AlertTriangle className="size-4" /> Falta cargar las lecciones de este curso antes de asignarlo.
                  </p>
                )}
                {materia && (
                  <Button type="button" variant="outline" onClick={() => setFormCurso(true)}>
                    <Plus /> Nuevo curso
                  </Button>
                )}
              </div>
            </Step>

            <Step title="Cuándo">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Alumnos</Label>
                  {alumnos.map((a) => (
                    <label key={a.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={elegidos.includes(a.id)} onCheckedChange={() => alternar(a.id)} /> {a.nombre}
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="as-ini">Desde</Label>
                    <Input id="as-ini" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="as-fin">Hasta</Label>
                    <Input id="as-fin" type="date" value={fin} onChange={(e) => setFin(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Días de clase</Label>
                  <div className="flex gap-1.5">
                    {DIAS.map((d) => (
                      <button
                        key={d.iso}
                        type="button"
                        aria-label={d.largo}
                        aria-pressed={dias.includes(d.iso)}
                        onClick={() => alternarDia(d.iso)}
                        className={`size-9 rounded-lg border text-sm font-medium transition-colors ${dias.includes(d.iso) ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                      >
                        {d.corto}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Step>

            <Step title="Vista previa">
              {!previas ? (
                <div className="flex justify-center py-6">
                  <Spinner className="size-6 text-primary" />
                </div>
              ) : (
                <div className="space-y-3">
                  {elegidos.map((id) => {
                    const alumno = alumnos.find((a) => a.id === id);
                    const p = previas[id];
                    return (
                      <div key={id} className="rounded-lg border p-3 text-sm">
                        <p className="font-medium text-foreground">{alumno?.nombre}</p>
                        {typeof p === "string" ? (
                          <p className="text-destructive">{p}</p>
                        ) : p.aviso?.tipo === "sin_dias" ? (
                          <p className="text-destructive">No hay días lectivos en ese rango.</p>
                        ) : (
                          <p className="text-muted-foreground">
                            {p.dias.length} días de clase · {p.pendientes} unidades · promedio {p.promedio.toFixed(1)} por día
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {sobrecarga?.aviso && (
                    <div className="space-y-2 rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm">
                      <p className="flex items-center gap-2 font-medium text-warning">
                        <AlertTriangle className="size-4" /> Ritmo muy alto ({sobrecarga.promedio.toFixed(1)} por día)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sobrecarga.aviso.opciones.map((op) => (
                          <Button key={op} type="button" size="sm" variant="outline" onClick={() => aplicarOpcion(op)} disabled={op === "aceptar el ritmo"}>
                            {op}
                          </Button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Si no cambiás nada, se acepta el ritmo tal cual.</p>
                    </div>
                  )}
                </div>
              )}
            </Step>
          </Stepper>
        </DialogContent>
      </Dialog>

      <MateriaForm
        open={formMateria}
        onClose={() => setFormMateria(false)}
        onSuccess={(g) => {
          setLista((l) => [...l, g]);
          setMateria(g);
          setFormMateria(false);
          router.refresh();
        }}
      />
      {materia && (
        <CursoForm
          open={formCurso}
          materiaId={materia.id}
          onClose={() => setFormCurso(false)}
          onSuccess={(m) => {
            setFormCurso(false);
            void cargarCursos(materia);
            setCurso(m);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
