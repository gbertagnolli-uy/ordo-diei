"use client";
// Asistente del diario (lane 298): el estado del chat — almacén local (ajustes, proveedores, claves y sesiones), el bucle del agente en marcha y las aprobaciones.
// Portado de la lógica de vendor/moodiary/.../presentation/assistant_page.dart (`_submit`, `_generate`, `_stop`, `_regenerate`, `_continueTurn`, `_resolveApproval`;
// ZhuJHua/moodiary@2c552dd). Todo el historial queda en este navegador (D4); la clave de cada proveedor, también (D1).
import { useCallback, useEffect, useRef, useState } from "react";
import { correrAgente, historialParaElModelo } from "@/lib/diario/asistente/agente";
import { compactables, compactadaNueva, porCompactar } from "@/lib/diario/asistente/compactacion";
import { MARCA_CONTINUAR, MAX_TOKENS_RESPUESTA, confirmaEscrituras, type Herramienta, type HerramientaDeMemoria, type Nivel } from "@/lib/diario/asistente/herramientas";
import { citarEntrada } from "@/lib/diario/asistente/citas";
import { editarHecho, ejecutarMemoria, hechosValidos, quitarHecho, type CategoriaHecho, type Hecho } from "@/lib/diario/asistente/memoria";
import { contextoDelTurno, promptDeSistema } from "@/lib/diario/asistente/prompt";
import { MAX_CLAVE, opcionesDeModelo, type Proveedor } from "@/lib/diario/asistente/proveedores";
import {
  AJUSTES_INICIALES,
  ajustesValidos,
  claveAlmacen,
  nuevoId,
  paraGuardar,
  proveedoresValidos,
  sesionNueva,
  sesionesValidas,
  turnoDeAsistente,
  turnoDeUsuario,
  type Ajustes,
  type Sesion,
  type TurnoChat,
} from "@/lib/diario/asistente/sesiones";
import { compactarConversacion, dependenciasReales, titularSesion, type ConexionModelo } from "./cliente";

const VENCE_APROBACION_MS = 5 * 60_000;

export interface Aprobacion {
  id: string;
  nombre: Herramienta;
  args: Record<string, unknown>;
  nivel: Nivel;
}

function leer<T>(clave: string, convertir: (v: unknown) => T, defecto: T): T {
  try {
    const crudo = localStorage.getItem(clave);
    return crudo === null ? defecto : convertir(JSON.parse(crudo));
  } catch {
    return defecto;
  }
}

function escribir(clave: string, valor: unknown): void {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* sin almacenamiento o lleno: queda solo en esta sesión */
  }
}

const clavesValidas = (v: unknown): Record<string, string> => {
  const salida: Record<string, string> = {};
  if (typeof v === "object" && v !== null) for (const [k, valor] of Object.entries(v)) if (typeof valor === "string" && valor && valor.length <= MAX_CLAVE) salida[k] = valor;
  return salida;
};

/** La conversación abierta por persona, para seguir en ella si se sale a ver una entrada y se vuelve (solo memoria de la pestaña). */
const ultimaActiva = new Map<number, string>();

export function useAsistente(usuarioId: number) {
  const kAjustes = claveAlmacen(usuarioId, "ajustes");
  const kProveedores = claveAlmacen(usuarioId, "proveedores");
  const kClaves = claveAlmacen(usuarioId, "claves");
  const kSesiones = claveAlmacen(usuarioId, "sesiones");
  const kMemoria = claveAlmacen(usuarioId, "memoria");

  // Este componente solo se dibuja después de que la persona lo abre, nunca en el servidor: se puede leer el almacén al crear el estado.
  const [ajustes, setAjustes] = useState<Ajustes>(() => leer(kAjustes, ajustesValidos, AJUSTES_INICIALES));
  const [proveedores, setProveedores] = useState<Proveedor[]>(() => leer(kProveedores, proveedoresValidos, []));
  const [claves, setClaves] = useState<Record<string, string>>(() => leer(kClaves, clavesValidas, {}));
  const [sesiones, setSesiones] = useState<Sesion[]>(() => leer(kSesiones, sesionesValidas, []));
  const [hechos, setHechos] = useState<Hecho[]>(() => leer(kMemoria, hechosValidos, []));
  const [activaId, setActivaId] = useState<string | null>(() => ultimaActiva.get(usuarioId) ?? null);
  /** El turno del asistente que se está escribiendo (todavía no está en `sesiones`). */
  const [vivo, setVivo] = useState<{ sesionId: string; turno: TurnoChat } | null>(null);
  const [aprobaciones, setAprobaciones] = useState<Aprobacion[]>([]);
  const [compactando, setCompactando] = useState<string | null>(null);

  const control = useRef<AbortController | null>(null);
  const pendientes = useRef(new Map<string, (ok: boolean) => void>());
  const sesionesRef = useRef(sesiones);
  const ajustesRef = useRef(ajustes);
  const hechosRef = useRef(hechos);
  const compactandoRef = useRef(new Set<string>());

  useEffect(() => {
    sesionesRef.current = sesiones;
    escribir(kSesiones, paraGuardar(sesiones));
  }, [sesiones, kSesiones]);
  useEffect(() => {
    hechosRef.current = hechos;
    escribir(kMemoria, hechos);
  }, [hechos, kMemoria]);
  useEffect(() => {
    ajustesRef.current = ajustes;
  }, [ajustes]);
  useEffect(() => {
    if (activaId) ultimaActiva.set(usuarioId, activaId);
    else ultimaActiva.delete(usuarioId);
  }, [activaId, usuarioId]);

  const aplicarHechos = useCallback((nuevos: Hecho[]) => {
    hechosRef.current = nuevos;
    setHechos(nuevos);
  }, []);

  const ejecutarMemoriaLocal = useCallback(
    async (nombre: HerramientaDeMemoria, args: Record<string, unknown>) => {
      const r = await ejecutarMemoria(nombre, args, hechosRef.current, { ahora: Date.now(), nuevoId });
      aplicarHechos(r.hechos);
      return r.resultado;
    },
    [aplicarHechos],
  );

  const proveedor = proveedores.find((p) => p.id === ajustes.proveedorActivo) ?? proveedores[0] ?? null;
  const activa = sesiones.find((s) => s.id === activaId) ?? null;
  const ocupado = vivo !== null;

  // ── Ajustes, proveedores y claves ─────────────────────────────────────────

  const guardarAjustes = useCallback(
    (parcial: Partial<Ajustes>) => {
      const nuevo = ajustesValidos({ ...ajustesRef.current, ...parcial });
      ajustesRef.current = nuevo;
      setAjustes(nuevo);
      escribir(kAjustes, nuevo);
    },
    [kAjustes],
  );

  const guardarProveedor = useCallback(
    (p: Proveedor, clave: string | null) => {
      const existe = proveedores.some((x) => x.id === p.id);
      const resultado = proveedoresValidos(existe ? proveedores.map((x) => (x.id === p.id ? p : x)) : [...proveedores, p]);
      setProveedores(resultado);
      escribir(kProveedores, resultado);
      if (clave !== null) {
        const nuevas = { ...claves, [p.id]: clave.trim() };
        if (!nuevas[p.id]) delete nuevas[p.id];
        setClaves(nuevas);
        escribir(kClaves, nuevas);
      }
      if (!ajustesRef.current.proveedorActivo || !resultado.some((x) => x.id === ajustesRef.current.proveedorActivo)) guardarAjustes({ proveedorActivo: p.id });
    },
    [proveedores, claves, kProveedores, kClaves, guardarAjustes],
  );

  const borrarProveedor = useCallback(
    (id: string) => {
      const resto = proveedores.filter((p) => p.id !== id);
      setProveedores(resto);
      escribir(kProveedores, resto);
      const nuevas = { ...claves };
      delete nuevas[id];
      setClaves(nuevas);
      escribir(kClaves, nuevas);
      if (ajustesRef.current.proveedorActivo === id) guardarAjustes({ proveedorActivo: resto[0]?.id ?? null });
    },
    [proveedores, claves, kProveedores, kClaves, guardarAjustes],
  );

  // ── Sesiones ──────────────────────────────────────────────────────────────

  const ponerSesion = useCallback((id: string, cambiar: (s: Sesion) => Sesion) => {
    setSesiones((lista) => lista.map((s) => (s.id === id ? cambiar(s) : s)));
  }, []);

  const borrarSesion = useCallback((id: string) => {
    setSesiones((lista) => lista.filter((s) => s.id !== id));
    setActivaId((a) => (a === id ? null : a));
  }, []);

  const borrarTodo = useCallback(() => {
    setSesiones([]);
    setActivaId(null);
  }, []);

  // ── Aprobaciones ──────────────────────────────────────────────────────────

  const resolverAprobacion = useCallback((id: string, ok: boolean) => {
    pendientes.current.get(id)?.(ok);
  }, []);

  const rechazarPendientes = useCallback(() => {
    for (const resolver of [...pendientes.current.values()]) resolver(false);
  }, []);

  const aprobar = useCallback(
    (id: string, nombre: Herramienta, args: Record<string, unknown>, nivel: Nivel) =>
      new Promise<boolean>((resolver) => {
        const reloj = setTimeout(() => pendientes.current.get(id)?.(false), VENCE_APROBACION_MS);
        pendientes.current.set(id, (ok) => {
          clearTimeout(reloj);
          pendientes.current.delete(id);
          setAprobaciones((a) => a.filter((x) => x.id !== id));
          resolver(ok);
        });
        setAprobaciones((a) => [...a, { id, nombre, args, nivel }]);
      }),
    [],
  );

  // ── El bucle ──────────────────────────────────────────────────────────────

  type ResultadoCompactar = "hecho" | "nada" | "fallo";
  const compactar = useCallback(
    async (sesionId: string, turnos: TurnoChat[], conexion: ConexionModelo, forzar: boolean): Promise<ResultadoCompactar> => {
      if (compactandoRef.current.has(sesionId)) return "nada";
      const sesion = sesionesRef.current.find((s) => s.id === sesionId);
      if (!sesion) return "nada";
      const ultimo = [...turnos].reverse().find((t) => !t.deUsuario && t.entradaTokens > 0);
      const plan = porCompactar({ compactada: sesion.compactada, mensajes: compactables(turnos), entradaTokens: ultimo?.entradaTokens ?? 0, limiteContexto: ajustesRef.current.contexto, forzar });
      if (plan === null) return "nada";
      compactandoRef.current.add(sesionId);
      setCompactando(sesionId);
      try {
        const resumen = await compactarConversacion(conexion, plan.resumenPrevio, plan.aResumir);
        if (!resumen) return "fallo";
        ponerSesion(sesionId, (s) => ({ ...s, compactada: compactadaNueva(resumen, plan.hastaId, ultimo?.entradaTokens ?? 0) }));
        return "hecho";
      } finally {
        compactandoRef.current.delete(sesionId);
        setCompactando(null);
      }
    },
    [ponerSesion],
  );

  const correr = useCallback(
    async (sesionId: string, turnosPrevios: TurnoChat[], conexion: ConexionModelo) => {
      const abortar = new AbortController();
      control.current = abortar;
      let actual = turnoDeAsistente(conexion.modelo, conexion.proveedor.id);
      let separar = false;
      const publicar = (t: TurnoChat) => {
        actual = t;
        setVivo({ sesionId, turno: t });
      };
      publicar(actual);
      const a = ajustesRef.current;
      const deps = dependenciasReales({
        conexion,
        sistema: promptDeSistema({ herramientas: true, memoria: a.memoria, notas: a.notas, confirmaEscrituras: confirmaEscrituras(a.modoPermiso) }),
        contexto: contextoDelTurno(new Date(), a.memoria ? hechosRef.current.length : undefined),
        memoria: a.memoria,
        ejecutarMemoria: ejecutarMemoriaLocal,
        aprobar,
        maxTokens: MAX_TOKENS_RESPUESTA,
      });
      try {
        for await (const ev of correrAgente(deps, {
          mensajes: historialParaElModelo(turnosPrevios, sesionesRef.current.find((s) => s.id === sesionId)?.compactada ?? null),
          modo: a.modoPermiso,
          senal: abortar.signal,
        })) {
          if (ev.t === "texto") {
            publicar({ ...actual, texto: `${actual.texto}${separar && actual.texto ? "\n\n" : ""}${ev.d}` });
            separar = false;
          } else if (ev.t === "llamada") {
            publicar({ ...actual, llamadas: [...actual.llamadas, { id: ev.id, nombre: ev.nombre, args: ev.args, resultado: "", hecha: false }] });
          } else if (ev.t === "resultado") {
            separar = true;
            publicar({ ...actual, llamadas: actual.llamadas.map((l) => (l.id === ev.id && !l.hecha ? { ...l, resultado: ev.resultado, hecha: true } : l)) });
          } else if (ev.t === "uso") {
            publicar({ ...actual, entradaTokens: ev.entrada, salidaTokens: actual.salidaTokens + ev.salida });
          } else if (ev.t === "fin") {
            if (ev.motivo === "longitud") actual = { ...actual, truncado: true };
            else if (ev.motivo === "error") actual = { ...actual, error: ev.mensaje ?? "Algo falló" };
            else if (ev.motivo === "max_turnos") actual = { ...actual, error: "El asistente llegó al máximo de pasos seguidos. Podés pedirle que siga." };
          }
        }
      } catch (e) {
        actual = { ...actual, error: e instanceof Error ? e.message : "Algo falló" };
      } finally {
        rechazarPendientes();
        control.current = null;
      }
      // Las llamadas que no llegaron a terminar (se cortó) no se guardan como hechas
      const final: TurnoChat = { ...actual, llamadas: actual.llamadas.filter((l) => l.hecha) };
      if (final.texto || final.llamadas.length || final.error || final.truncado) {
        ponerSesion(sesionId, (s) => ({ ...s, actualizadaEn: Date.now(), turnos: [...s.turnos, final] }));
      }
      setVivo(null);
      // Título automático al terminar la primera respuesta (moodiary `SessionTitleController`)
      const sesion = sesionesRef.current.find((s) => s.id === sesionId);
      if (sesion && !sesion.titulo && !final.error && (final.texto || final.llamadas.length)) {
        const primero = turnosPrevios.find((t) => t.deUsuario)?.texto ?? "";
        void titularSesion(conexion, primero.replace(/^\[diary:\d+\]\n?/, "")).then((titulo) => {
          if (titulo) ponerSesion(sesionId, (s) => (s.titulo ? s : { ...s, titulo }));
        });
      }
      if (!final.error) {
        void compactar(sesionId, [...turnosPrevios, final], conexion, false);
      }
    },
    [aprobar, compactar, ejecutarMemoriaLocal, ponerSesion, rechazarPendientes],
  );

  /** La conexión que se usaría ahora, o el motivo por el que todavía no se puede. */
  const conexionPara = useCallback(
    (sesion: Sesion | null): ConexionModelo | string => {
      const p = proveedores.find((x) => x.id === sesion?.proveedorId) ?? proveedor;
      if (!p) return "Primero agregá un proveedor de modelos.";
      const apiKey = claves[p.id];
      if (!apiKey) return `Falta la clave de ${p.nombre}.`;
      const modelo = sesion?.modelo || p.modelo;
      if (!modelo) return "Elegí un modelo.";
      return { proveedor: p, apiKey, modelo };
    },
    [proveedores, proveedor, claves],
  );

  /** Manda un mensaje. Devuelve un texto si no se pudo empezar. */
  const enviar = useCallback(
    (texto: string, citaId: number | null = null): string | null => {
      const limpio = texto.trim();
      if (!limpio || vivo) return null;
      const existente = sesionesRef.current.find((s) => s.id === activaId) ?? null;
      const conexion = conexionPara(existente);
      if (typeof conexion === "string") return conexion;
      const turno = turnoDeUsuario(citaId ? citarEntrada(limpio, citaId) : limpio);
      let sesion = existente;
      if (!sesion) {
        sesion = sesionNueva(conexion.proveedor.id, conexion.modelo);
        setSesiones((lista) => [{ ...sesion!, turnos: [turno] }, ...lista]);
        setActivaId(sesion.id);
      } else {
        ponerSesion(sesion.id, (s) => ({ ...s, actualizadaEn: Date.now(), turnos: [...s.turnos, turno] }));
      }
      void correr(sesion.id, [...sesion.turnos, turno], conexion);
      return null;
    },
    [vivo, activaId, conexionPara, ponerSesion, correr],
  );

  const detener = useCallback(() => {
    control.current?.abort();
    rechazarPendientes();
  }, [rechazarPendientes]);

  /** moodiary `_regenerate`: descarta la última respuesta y vuelve a preguntar lo mismo. */
  const regenerar = useCallback((): string | null => {
    const sesion = sesionesRef.current.find((s) => s.id === activaId);
    if (!sesion || vivo) return null;
    const i = sesion.turnos.map((t) => t.deUsuario).lastIndexOf(true);
    if (i === -1) return null;
    const conexion = conexionPara(sesion);
    if (typeof conexion === "string") return conexion;
    const previos = sesion.turnos.slice(0, i + 1);
    ponerSesion(sesion.id, (s) => ({ ...s, turnos: previos, compactada: s.compactada && previos.some((t) => t.id === s.compactada!.hastaId) ? s.compactada : null }));
    void correr(sesion.id, previos, conexion);
    return null;
  }, [activaId, vivo, conexionPara, ponerSesion, correr]);

  /** moodiary `_continueTurn`: sigue una respuesta que se cortó por longitud. */
  const continuar = useCallback((): string | null => {
    const sesion = sesionesRef.current.find((s) => s.id === activaId);
    if (!sesion || vivo) return null;
    const conexion = conexionPara(sesion);
    if (typeof conexion === "string") return conexion;
    const turno = turnoDeUsuario(MARCA_CONTINUAR);
    const previos = [...sesion.turnos, turno];
    ponerSesion(sesion.id, (s) => ({ ...s, turnos: previos }));
    void correr(sesion.id, previos, conexion);
    return null;
  }, [activaId, vivo, conexionPara, ponerSesion, correr]);

  const compactarAhora = useCallback(async (): Promise<{ ok: boolean; mensaje: string }> => {
    const sesion = sesionesRef.current.find((s) => s.id === activaId);
    if (!sesion || vivo) return { ok: false, mensaje: "No hay nada para compactar ahora." };
    const conexion = conexionPara(sesion);
    if (typeof conexion === "string") return { ok: false, mensaje: conexion };
    const res = await compactar(sesion.id, sesion.turnos, conexion, true);
    if (res === "hecho") return { ok: true, mensaje: "Mensajes anteriores resumidos." };
    if (res === "nada") return { ok: false, mensaje: "No hay nada para compactar." };
    return { ok: false, mensaje: "No se pudo compactar. Probá de nuevo más tarde." };
  }, [activaId, vivo, conexionPara, compactar]);

  const restaurarHistorial = useCallback((id: string) => ponerSesion(id, (s) => ({ ...s, compactada: null })), [ponerSesion]);

  const editarHechoPorId = useCallback(
    (id: string, cambios: { texto: string; categoria: CategoriaHecho }) => {
      aplicarHechos(editarHecho(hechosRef.current, id, cambios, Date.now()));
    },
    [aplicarHechos],
  );

  const olvidarHecho = useCallback(
    (id: string) => {
      aplicarHechos(quitarHecho(hechosRef.current, id));
    },
    [aplicarHechos],
  );

  const olvidarTodosLosHechos = useCallback(() => {
    aplicarHechos([]);
  }, [aplicarHechos]);

  const elegirModelo = useCallback(
    (proveedorId: string, modelo: string) => {
      guardarAjustes({ proveedorActivo: proveedorId });
      if (activaId) ponerSesion(activaId, (s) => ({ ...s, proveedorId, modelo }));
    },
    [activaId, guardarAjustes, ponerSesion],
  );

  // Al salir de la pantalla se corta lo que esté en marcha
  useEffect(
    () => () => {
      control.current?.abort();
      for (const resolver of [...pendientes.current.values()]) resolver(false);
    },
    [],
  );

  const modelosDisponibles = proveedor ? opcionesDeModelo(proveedor) : [];

  return {
    ajustes,
    proveedores,
    claves,
    sesiones,
    hechos,
    activa,
    activaId,
    vivo,
    ocupado,
    aprobaciones,
    proveedor,
    modelosDisponibles,
    compactando,
    abrirSesion: setActivaId,
    nuevaSesion: () => setActivaId(null),
    borrarSesion,
    borrarTodo,
    guardarAjustes,
    guardarProveedor,
    borrarProveedor,
    elegirModelo,
    enviar,
    detener,
    regenerar,
    continuar,
    resolverAprobacion,
    compactarAhora,
    restaurarHistorial,
    editarHechoPorId,
    olvidarHecho,
    olvidarTodosLosHechos,
  };
}
