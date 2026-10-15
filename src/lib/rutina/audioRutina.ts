/**
 * Motor de audio sintetizado con Web Audio API para alarmas y transiciones de rutina.
 * 100% autónomo: no depende de archivos de audio externos, no falla por 404,
 * funciona sin conexión y produce tonos armónicos agradables.
 */

export type TipoSonidoRutina = "campanilla" | "monasterio" | "cuenco" | "marimba" | "suave";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Crea/reanuda el AudioContext. Debe llamarse dentro de un gesto del usuario para que el
 * navegador permita luego que la campana suene sola al cambiar de etapa.
 */
export function prepararAudio() {
  getAudioContext();
}

export function reproducirAlarma(tipo: TipoSonidoRutina = "campanilla", volumenPorcentaje = 75) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const masterVol = Math.max(0, Math.min(1, (volumenPorcentaje / 100) * 0.4));
  if (masterVol <= 0) return;

  const now = ctx.currentTime;

  switch (tipo) {
    case "monasterio": {
      // Campana grave de monasterio con sobretonos ricos (Angelus)
      const frecs = [220, 440, 554.37, 880];
      const pesos = [0.6, 0.4, 0.3, 0.15];
      frecs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(masterVol * pesos[idx], now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 3.3);
      });
      break;
    }

    case "cuenco": {
      // Cuenco tibetano sereno con modulación lenta
      const frecBase = 320;
      [frecBase, frecBase * 1.5, frecBase * 2.76].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now);

        const dur = 4.0;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(masterVol * (0.5 / (idx + 1)), now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + dur + 0.1);
      });
      break;
    }

    case "marimba": {
      // Arpegio alegre de marimba / madera
      const notas = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notas.forEach((nota, i) => {
        const t = now + i * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(nota, t);

        gain.gain.setValueAtTime(masterVol * 0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.65);
      });
      break;
    }

    case "suave": {
      // Dos tonos suaves y modernos
      const notas = [880, 1174.66]; // A5 -> D6
      notas.forEach((nota, i) => {
        const t = now + i * 0.18;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(nota, t);

        gain.gain.setValueAtTime(masterVol * 0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.85);
      });
      break;
    }

    case "campanilla":
    default: {
      // Campanilla cristalina tradicional (arpegio celestial)
      const notas = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
      notas.forEach((nota, i) => {
        const t = now + i * 0.14;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(nota, t);

        gain.gain.setValueAtTime(masterVol * 0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 1.25);
      });
      break;
    }
  }
}

/**
 * Solicita permiso para notificaciones nativas del navegador.
 */
export async function solicitarPermisoNotificacion(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  if (Notification.permission === "granted") {
    return true;
  }
  if (Notification.permission !== "denied") {
    const res = await Notification.requestPermission();
    return res === "granted";
  }
  return false;
}

/**
 * Emite una notificación nativa si hay permisos concedidos.
 */
export function emitirNotificacion(titulo: string, opciones?: NotificationOptions) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    try {
      new Notification(titulo, {
        icon: "/favicon.ico",
        ...opciones,
      });
    } catch {
      // Ignorar si falla por contexto no seguro
    }
  }
}
