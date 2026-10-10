"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Save,
  X,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Calendar,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldSet,
} from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Badge } from "@/components/ui/badge";
import { EspacioImagenGrado } from "./EspacioImagenGrado";
import { AdminVistaPreviaEnVivo } from "./AdminVistaPreviaEnVivo";
import {
  esquemaCartaAdmin,
  generarClaveSlug,
} from "@/lib/cartas/esquema";
import {
  CONFIG_RAREZAS,
  type RarezaCarta,
  type CategoriaCarta,
} from "@/lib/cartas/economia";
import type { CartaAdminItem } from "@/lib/cartas/server";

interface FormularioCartaAdminProps {
  cartaInicial?: CartaAdminItem | null;
  onGuardado: (carta: CartaAdminItem) => void;
  onCancelar: () => void;
}

const MESES = [
  { valor: "01", nombre: "01 - Enero" },
  { valor: "02", nombre: "02 - Febrero" },
  { valor: "03", nombre: "03 - Marzo" },
  { valor: "04", nombre: "04 - Abril" },
  { valor: "05", nombre: "05 - Mayo" },
  { valor: "06", nombre: "06 - Junio" },
  { valor: "07", nombre: "07 - Julio" },
  { valor: "08", nombre: "08 - Agosto" },
  { valor: "09", nombre: "09 - Septiembre" },
  { valor: "10", nombre: "10 - Octubre" },
  { valor: "11", nombre: "11 - Noviembre" },
  { valor: "12", nombre: "12 - Diciembre" },
];

export function FormularioCartaAdmin({
  cartaInicial,
  onGuardado,
  onCancelar,
}: FormularioCartaAdminProps) {
  const esEdicion = Boolean(cartaInicial?.id);

  // Estados del formulario
  const [nombre, setNombre] = useState<string>(cartaInicial?.nombre || "");
  const [subtitulo, setSubtitulo] = useState<string>(cartaInicial?.subtitulo || "");
  const [clave, setClave] = useState<string>(cartaInicial?.clave || "");
  const [claveModificadaManualmente, setClaveModificadaManualmente] = useState<boolean>(esEdicion);

  const [categoria, setCategoria] = useState<CategoriaCarta>(
    cartaInicial?.categoria || "Santo"
  );
  const [rareza, setRareza] = useState<RarezaCarta>(
    cartaInicial?.rareza || "Comun"
  );

  // Celebración (mes y día)
  const [mesCelebracion, setMesCelebracion] = useState<string>(() => {
    if (cartaInicial?.celebracion && cartaInicial.celebracion.includes("-")) {
      return cartaInicial.celebracion.split("-")[0];
    }
    return "";
  });
  const [diaCelebracion, setDiaCelebracion] = useState<string>(() => {
    if (cartaInicial?.celebracion && cartaInicial.celebracion.includes("-")) {
      return cartaInicial.celebracion.split("-")[1];
    }
    return "";
  });

  const [historia, setHistoria] = useState<string>(cartaInicial?.historia || "");
  const [oracion, setOracion] = useState<string>(cartaInicial?.oracion || "");
  const [frase, setFrase] = useState<string>(cartaInicial?.frase || "");
  const [fraseAutor, setFraseAutor] = useState<string>(cartaInicial?.fraseAutor || "");

  // Datasheet ordenable (4 a 8 items)
  const [datasheet, setDatasheet] = useState<Array<{ etiqueta: string; valor: string }>>(() => {
    if (cartaInicial?.datasheet && cartaInicial.datasheet.length >= 4) {
      return [...cartaInicial.datasheet];
    }
    return [
      { etiqueta: "Nacimiento", valor: "" },
      { etiqueta: "Fallecimiento", valor: "" },
      { etiqueta: "Patronazgo", valor: "" },
      { etiqueta: "Canonización", valor: "" },
    ];
  });

  // Imágenes por grado
  const [imagenUrl, setImagenUrl] = useState<string>(
    cartaInicial?.imagenUrl || "/cartas/santo-rosario/1.webp"
  );
  const [imagenGrado2Url, setImagenGrado2Url] = useState<string | null>(
    cartaInicial?.imagenGrado2Url || null
  );
  const [imagenGrado3Url, setImagenGrado3Url] = useState<string | null>(
    cartaInicial?.imagenGrado3Url || null
  );
  const [imagenGrado4Url, setImagenGrado4Url] = useState<string | null>(
    cartaInicial?.imagenGrado4Url || null
  );
  const [creditoImagen, setCreditoImagen] = useState<string>(
    cartaInicial?.creditoImagen || ""
  );

  // Fragmentos requeridos
  const [fragmentosPersonalizados, setFragmentosPersonalizados] = useState<number | "">(() => {
    if (cartaInicial?.fragmentosRequeridos) {
      return cartaInicial.fragmentosRequeridos;
    }
    return CONFIG_RAREZAS[cartaInicial?.rareza || "Comun"].fragmentosRequeridos;
  });

  const [guardando, setGuardando] = useState<boolean>(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);

  // Auto-generar slug si no se modificó a mano
  useEffect(() => {
    if (!claveModificadaManualmente && !esEdicion) {
      setClave(generarClaveSlug(nombre));
    }
  }, [nombre, claveModificadaManualmente, esEdicion]);

  // Al cambiar rareza, si no se especificó un valor personalizado diferente, ajustar por defecto
  const manejarCambioRareza = (nuevaRareza: RarezaCarta) => {
    setRareza(nuevaRareza);
    if (!esEdicion) {
      setFragmentosPersonalizados(CONFIG_RAREZAS[nuevaRareza].fragmentosRequeridos);
    }
  };

  // Cadena de celebración computada "MM-DD" o null
  const celebracionFinal = useMemo(() => {
    if (mesCelebracion && diaCelebracion) {
      const d = diaCelebracion.padStart(2, "0");
      return `${mesCelebracion}-${d}`;
    }
    return null;
  }, [mesCelebracion, diaCelebracion]);

  // Fragmentos requeridos efectivos
  const fragmentosEfectivos =
    typeof fragmentosPersonalizados === "number" && fragmentosPersonalizados > 0
      ? fragmentosPersonalizados
      : CONFIG_RAREZAS[rareza].fragmentosRequeridos;

  // Hitos calculados
  const hitos = useMemo(() => {
    const req = fragmentosEfectivos;
    return {
      h25: Math.ceil(req * 0.25),
      h50: Math.ceil(req * 0.5),
      h100: req,
      h150: Math.round(req * 1.5),
      h200: req * 2,
      h300: req * 3,
    };
  }, [fragmentosEfectivos]);

  // Manejo de orden del Datasheet
  const moverDato = (indice: number, direccion: "arriba" | "abajo") => {
    const destino = direccion === "arriba" ? indice - 1 : indice + 1;
    if (destino < 0 || destino >= datasheet.length) return;
    setDatasheet((prev) => {
      const nuevo = [...prev];
      const temp = nuevo[indice];
      nuevo[indice] = nuevo[destino];
      nuevo[destino] = temp;
      return nuevo;
    });
  };

  const actualizarDato = (indice: number, campo: "etiqueta" | "valor", valor: string) => {
    setDatasheet((prev) => {
      const nuevo = [...prev];
      nuevo[indice] = { ...nuevo[indice], [campo]: valor };
      return nuevo;
    });
  };

  const agregarDato = () => {
    if (datasheet.length >= 8) return;
    setDatasheet((prev) => [...prev, { etiqueta: "", valor: "" }]);
  };

  const quitarDato = (indice: number) => {
    if (datasheet.length <= 4) return;
    setDatasheet((prev) => prev.filter((_, i) => i !== indice));
  };

  // Borrador dinámico para vista previa en vivo
  const cartaBorrador = useMemo(() => {
    return {
      clave: clave.trim() || "slug-carta",
      nombre: nombre.trim() || "Nombre de la Carta",
      subtitulo: subtitulo.trim() || null,
      categoria,
      rareza,
      celebracion: celebracionFinal,
      historia: historia.trim() || "Historia sagrada del Siervo de Dios.",
      oracion: oracion.trim() || "Oración devocional a la devoción.",
      frase: frase.trim() || "Frase inspiradora católica.",
      fraseAutor: fraseAutor.trim() || null,
      datasheet,
      imagenUrl,
      imagenGrado2Url,
      imagenGrado3Url,
      imagenGrado4Url,
      creditoImagen: creditoImagen.trim() || null,
      fragmentosRequeridos: fragmentosEfectivos,
    };
  }, [
    clave,
    nombre,
    subtitulo,
    categoria,
    rareza,
    celebracionFinal,
    historia,
    oracion,
    frase,
    fraseAutor,
    datasheet,
    imagenUrl,
    imagenGrado2Url,
    imagenGrado3Url,
    imagenGrado4Url,
    creditoImagen,
    fragmentosEfectivos,
  ]);

  // Envío del formulario
  const manejarGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrores({});
    setErrorGlobal(null);

    const payload = {
      id: cartaInicial?.id,
      clave: clave.trim(),
      nombre: nombre.trim(),
      subtitulo: subtitulo.trim() || null,
      categoria,
      rareza,
      celebracion: celebracionFinal,
      historia: historia.trim(),
      oracion: oracion.trim(),
      frase: frase.trim(),
      fraseAutor: fraseAutor.trim() || null,
      datasheet: datasheet.map((d) => ({
        etiqueta: d.etiqueta.trim(),
        valor: d.valor.trim(),
      })),
      imagenUrl: imagenUrl.trim(),
      imagenGrado2Url: imagenGrado2Url ? imagenGrado2Url.trim() : null,
      imagenGrado3Url: imagenGrado3Url ? imagenGrado3Url.trim() : null,
      imagenGrado4Url: imagenGrado4Url ? imagenGrado4Url.trim() : null,
      creditoImagen: creditoImagen.trim() || null,
      fragmentosRequeridos: fragmentosEfectivos,
      activa: cartaInicial?.activa ?? true,
    };

    // Validar en cliente con el zod de la lane 30
    const parseRes = esquemaCartaAdmin.safeParse(payload);
    if (!parseRes.success) {
      const nuevosErrores: Record<string, string> = {};
      for (const err of parseRes.error.issues) {
        const campo = err.path.join(".");
        nuevosErrores[campo] = err.message;
      }
      setErrores(nuevosErrores);
      setErrorGlobal("Por favor revisá los campos señalados antes de guardar.");
      return;
    }

    try {
      setGuardando(true);
      const url = "/api/cartas/admin";
      const metodo = esEdicion ? "PUT" : "POST";

      const res = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al procesar la solicitud");
      }

      onGuardado(data.carta);
    } catch (err: unknown) {
      console.error("Error al guardar carta:", err);
      const msg = err instanceof Error ? err.message : "Error inesperado al guardar";
      setErrorGlobal(msg);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado del modal / formulario */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-foreground">
            {esEdicion ? `Editar Carta: ${cartaInicial?.nombre}` : "Nueva Carta Sagrada"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {esEdicion
              ? "Modificá los atributos y devociones de esta carta sagrada."
              : "Completá los datos litúrgicos. Al crearla, se incluirá de inmediato en el álbum de todos en blanco y negro."}
          </p>
        </div>

        <Button type="button" variant="ghost" size="sm" onClick={onCancelar} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {errorGlobal && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorGlobal}</span>
        </div>
      )}

      {/* Disposición: Formulario (izq) y Vista Previa en Vivo (der) */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8 items-start">
        {/* Formulario */}
        <form onSubmit={manejarGuardar} className="flex flex-col gap-6">
          {/* SECCIÓN 1: Identificación y Clasificación */}
          <FieldSet className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 flex flex-col gap-4">
            <span className="font-semibold text-sm text-foreground">Identificación y Clasificación</span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Nombre sagrado *</FieldLabel>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: San Francisco de Asís"
                  required
                />
                {errores.nombre && <FieldError>{errores.nombre}</FieldError>}
              </Field>

              <Field>
                <FieldLabel>Subtítulo o Título</FieldLabel>
                <Input
                  value={subtitulo}
                  onChange={(e) => setSubtitulo(e.target.value)}
                  placeholder="Ej: Patrono de los pobres y la ecología"
                />
                {errores.subtitulo && <FieldError>{errores.subtitulo}</FieldError>}
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field>
                <FieldLabel>Clave (Slug identificador) *</FieldLabel>
                <Input
                  value={clave}
                  onChange={(e) => {
                    setClave(e.target.value);
                    setClaveModificadaManualmente(true);
                  }}
                  placeholder="san-francisco-de-asis"
                  className="font-mono text-xs"
                  required
                />
                {errores.clave && <FieldError>{errores.clave}</FieldError>}
              </Field>

              <Field>
                <FieldLabel>Categoría *</FieldLabel>
                <NativeSelect
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as CategoriaCarta)}
                  className="w-full"
                >
                  <NativeSelectOption value="Santo">Santo</NativeSelectOption>
                  <NativeSelectOption value="Angel">Ángel</NativeSelectOption>
                  <NativeSelectOption value="Misterio">Misterio</NativeSelectOption>
                  <NativeSelectOption value="Tema">Tema</NativeSelectOption>
                  <NativeSelectOption value="Persona">Persona</NativeSelectOption>
                </NativeSelect>
              </Field>

              <Field>
                <FieldLabel>Rareza *</FieldLabel>
                <NativeSelect
                  value={rareza}
                  onChange={(e) => manejarCambioRareza(e.target.value as RarezaCarta)}
                  className="w-full"
                >
                  <NativeSelectOption value="Comun">Común</NativeSelectOption>
                  <NativeSelectOption value="Buena">Buena</NativeSelectOption>
                  <NativeSelectOption value="Perfecta">Perfecta</NativeSelectOption>
                  <NativeSelectOption value="Celestial">Celestial</NativeSelectOption>
                </NativeSelect>
              </Field>
            </div>

            {/* Celebración litúrgica */}
            <div className="flex flex-col gap-2 rounded-lg bg-muted/30 p-3 border border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Celebración litúrgica anual (opcional)
                </span>
                {celebracionFinal && (
                  <Badge variant="secondary" className="font-mono text-xs">
                    {celebracionFinal}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <NativeSelect
                  value={mesCelebracion}
                  onChange={(e) => setMesCelebracion(e.target.value)}
                  className="w-full"
                >
                  <NativeSelectOption value="">Sin fecha fija / Variable</NativeSelectOption>
                  {MESES.map((m) => (
                    <NativeSelectOption key={m.valor} value={m.valor}>
                      {m.nombre}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>

                <NativeSelect
                  value={diaCelebracion}
                  disabled={!mesCelebracion}
                  onChange={(e) => setDiaCelebracion(e.target.value)}
                  className="w-full"
                >
                  <NativeSelectOption value="">Seleccionar día</NativeSelectOption>
                  {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")).map(
                    (d) => (
                      <NativeSelectOption key={d} value={d}>
                        Día {d}
                      </NativeSelectOption>
                    )
                  )}
                </NativeSelect>
              </div>

              {errores.celebracion && <FieldError>{errores.celebracion}</FieldError>}
            </div>
          </FieldSet>

          {/* SECCIÓN 2: Textos Sagrados y Devoción */}
          <FieldSet className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 flex flex-col gap-4">
            <span className="font-semibold text-sm text-foreground">Textos Sagrados y Devoción</span>

            <Field>
              <FieldLabel>Historia / Hagiografía (mín. 10 caracteres) *</FieldLabel>
              <Textarea
                rows={3}
                value={historia}
                onChange={(e) => setHistoria(e.target.value)}
                placeholder="Relato hagiográfico de su vida o el misterio..."
                required
              />
              {errores.historia && <FieldError>{errores.historia}</FieldError>}
            </Field>

            <Field>
              <FieldLabel>Oración devota (mín. 5 caracteres) *</FieldLabel>
              <Textarea
                rows={3}
                value={oracion}
                onChange={(e) => setOracion(e.target.value)}
                placeholder="Oración de intercesión o alabanza..."
                required
              />
              {errores.oracion && <FieldError>{errores.oracion}</FieldError>}
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Frase inspiradora *</FieldLabel>
                <Input
                  value={frase}
                  onChange={(e) => setFrase(e.target.value)}
                  placeholder="Ej: La paz comienza con una sonrisa."
                  required
                />
                {errores.frase && <FieldError>{errores.frase}</FieldError>}
              </Field>

              <Field>
                <FieldLabel>Autor de la frase (opcional)</FieldLabel>
                <Input
                  value={fraseAutor}
                  onChange={(e) => setFraseAutor(e.target.value)}
                  placeholder="Ej: Santa Teresa de Calcuta"
                />
                {errores.fraseAutor && <FieldError>{errores.fraseAutor}</FieldError>}
              </Field>
            </div>
          </FieldSet>

          {/* SECCIÓN 3: Datasheet Ordenable (4 a 8 datos) */}
          <FieldSet className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-sm text-foreground">Datasheet ordenable</span>
                <p className="text-xs text-muted-foreground">
                  Entre 4 y 8 datos. El orden de arriba hacia abajo determina la secuencia de revelación (D13).
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {datasheet.length} / 8 datos
              </Badge>
            </div>

            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 shrink-0" />
              <span>
                <strong>Regla de revelación:</strong> El 1° dato se revela al 25% de fragmentos, los intermedios se desbloquean gradualmente, y el último al completar el 100%.
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {datasheet.map((dato, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background p-2 transition-all shadow-2xs"
                >
                  <span className="text-xs font-mono font-bold text-muted-foreground w-5 text-center">
                    {idx + 1}.
                  </span>

                  <Input
                    value={dato.etiqueta}
                    onChange={(e) => actualizarDato(idx, "etiqueta", e.target.value)}
                    placeholder="Etiqueta (ej: Fiesta)"
                    className="h-8 text-xs flex-1"
                    required
                  />

                  <Input
                    value={dato.valor}
                    onChange={(e) => actualizarDato(idx, "valor", e.target.value)}
                    placeholder="Valor (ej: 4 de Octubre)"
                    className="h-8 text-xs flex-1"
                    required
                  />

                  {/* Acciones de reordenamiento */}
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={idx === 0}
                      onClick={() => moverDato(idx, "arriba")}
                      className="h-7 w-7 p-0"
                      title="Mover hacia arriba"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={idx === datasheet.length - 1}
                      onClick={() => moverDato(idx, "abajo")}
                      className="h-7 w-7 p-0"
                      title="Mover hacia abajo"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={datasheet.length <= 4}
                      onClick={() => quitarDato(idx)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      title={datasheet.length <= 4 ? "Mínimo 4 datos requeridos" : "Eliminar dato"}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {datasheet.length < 8 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={agregarDato}
                className="self-start gap-1.5 text-xs h-8"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar dato ({datasheet.length}/8)
              </Button>
            )}

            {errores.datasheet && <FieldError>{errores.datasheet}</FieldError>}
          </FieldSet>

          {/* SECCIÓN 4: Cuatro Espacios de Imagen por Grado (D19) */}
          <FieldSet className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 flex flex-col gap-4">
            <div>
              <span className="font-semibold text-sm text-foreground">Imágenes por Grado (D19)</span>
              <p className="text-xs text-muted-foreground">
                El Grado I es obligatorio. Si no subís imágenes para los grados II, III o IV, el sistema utilizará automáticamente la imagen del grado previo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EspacioImagenGrado
                grado={1}
                titulo="Grado I · Desbloqueada"
                obligatoria={true}
                urlActual={imagenUrl}
                onImagenCambiada={(url) => setImagenUrl(url || "")}
              />

              <EspacioImagenGrado
                grado={2}
                titulo="Grado II · Venerada"
                obligatoria={false}
                urlActual={imagenGrado2Url}
                urlFallback={imagenUrl}
                onImagenCambiada={setImagenGrado2Url}
              />

              <EspacioImagenGrado
                grado={3}
                titulo="Grado III · Iluminada"
                obligatoria={false}
                urlActual={imagenGrado3Url}
                urlFallback={imagenGrado2Url || imagenUrl}
                onImagenCambiada={setImagenGrado3Url}
              />

              <EspacioImagenGrado
                grado={4}
                titulo="Grado IV · Gloriosa"
                obligatoria={false}
                urlActual={imagenGrado4Url}
                urlFallback={imagenGrado3Url || imagenGrado2Url || imagenUrl}
                onImagenCambiada={setImagenGrado4Url}
              />
            </div>

            <Field>
              <FieldLabel>Crédito o autor de la imagen (opcional)</FieldLabel>
              <Input
                value={creditoImagen}
                onChange={(e) => setCreditoImagen(e.target.value)}
                placeholder="Ej: Giotto di Bondone / Basílica de San Francisco de Asís"
              />
            </Field>
          </FieldSet>

          {/* SECCIÓN 5: Economía de Fragmentos e Hitos */}
          <FieldSet className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-sm text-foreground">Fragmentos e Hitos Litúrgicos</span>
                <p className="text-xs text-muted-foreground">
                  Cantidad requerida para el desbloqueo inicial al 100% (Grado I).
                </p>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                Base rareza: {CONFIG_RAREZAS[rareza].fragmentosRequeridos} frag.
              </Badge>
            </div>

            <Field>
              <FieldLabel>Fragmentos requeridos (Grado I)</FieldLabel>
              <Input
                type="number"
                min={1}
                value={fragmentosPersonalizados}
                onChange={(e) =>
                  setFragmentosPersonalizados(e.target.value ? Number(e.target.value) : "")
                }
                className="max-w-[200px]"
                required
              />
            </Field>

            {/* Visualización de hitos calculados */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5 text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">25 % (1° dato)</span>
                <p className="font-mono text-sm font-bold text-foreground">{hitos.h25} frag.</p>
              </div>

              <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5 text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">50 % (Mitad)</span>
                <p className="font-mono text-sm font-bold text-foreground">{hitos.h50} frag.</p>
              </div>

              <div className="rounded-lg border border-border/60 bg-emerald-500/10 p-2.5 text-center">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold">100 % (Grado I)</span>
                <p className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-300">{hitos.h100} frag.</p>
              </div>

              <div className="rounded-lg border border-border/60 bg-sky-500/10 p-2.5 text-center">
                <span className="text-[10px] text-sky-600 dark:text-sky-400 uppercase font-semibold">150 % (Grado II)</span>
                <p className="font-mono text-sm font-bold text-sky-700 dark:text-sky-300">{hitos.h150} frag.</p>
              </div>

              <div className="rounded-lg border border-border/60 bg-indigo-500/10 p-2.5 text-center">
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-semibold">200 % (Grado III)</span>
                <p className="font-mono text-sm font-bold text-indigo-700 dark:text-indigo-300">{hitos.h200} frag.</p>
              </div>

              <div className="rounded-lg border border-border/60 bg-amber-500/10 p-2.5 text-center">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-semibold">300 % (Grado IV)</span>
                <p className="font-mono text-sm font-bold text-amber-700 dark:text-amber-300">{hitos.h300} frag.</p>
              </div>
            </div>
          </FieldSet>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onCancelar} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando} className="gap-2">
              <Save className="h-4 w-4" />
              {guardando ? "Guardando en el Cielo..." : esEdicion ? "Guardar Cambios" : "Crear Carta"}
            </Button>
          </div>
        </form>

        {/* Vista previa en vivo fija en pantalla grande */}
        <div className="xl:sticky xl:top-6">
          <AdminVistaPreviaEnVivo cartaBorrador={cartaBorrador} />
        </div>
      </div>
    </div>
  );
}
