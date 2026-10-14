// Portado de vendor/roost/src/components/groups/AddRecordingModal.tsx:54-69 y
// vendor/roost/src/components/groups/learn/LessonPlayer.tsx:30 (msrbuilds/roost@492af47).
// Cambios: regex ampliada (/embed/, /shorts/, watch?…&v=, m.youtube.com, player.vimeo.com), función pura, youtube-nocookie.

export type PlataformaVideo = "youtube" | "vimeo";

export interface EnlaceVideo {
  plataforma: PlataformaVideo;
  videoId: string;
  miniaturaUrl: string;
}

const ID_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;

export function miniaturaVideo(plataforma: PlataformaVideo, id: string): string {
  return plataforma === "youtube"
    ? `https://img.youtube.com/vi/${id}/mqdefault.jpg`
    : `https://vumbnail.com/${id}.jpg`;
}

export function urlEmbed(plataforma: PlataformaVideo, id: string): string {
  return plataforma === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${id}?rel=0`
    : `https://player.vimeo.com/video/${id}`;
}

export function parsearEnlaceVideo(entrada: string): EnlaceVideo | null {
  const texto = (entrada ?? "").trim();
  if (!texto) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^(www|m)\./, "");
  const partes = url.pathname.split("/").filter(Boolean);

  let youtube: string | undefined;
  if (host === "youtu.be") youtube = partes[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (partes[0] === "watch") youtube = url.searchParams.get("v") ?? undefined;
    else if (partes[0] === "embed" || partes[0] === "shorts") youtube = partes[1];
  }
  if (youtube !== undefined) {
    return ID_YOUTUBE.test(youtube)
      ? { plataforma: "youtube", videoId: youtube, miniaturaUrl: miniaturaVideo("youtube", youtube) }
      : null;
  }

  let vimeo: string | undefined;
  if (host === "vimeo.com") vimeo = partes[0];
  else if (host === "player.vimeo.com" && partes[0] === "video") vimeo = partes[1];
  if (vimeo !== undefined && /^\d+$/.test(vimeo)) {
    return { plataforma: "vimeo", videoId: vimeo, miniaturaUrl: miniaturaVideo("vimeo", vimeo) };
  }
  return null;
}
