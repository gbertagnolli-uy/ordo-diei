// Propio de Ordo: cliente HTTP común de los services portados de Roost. Los services de Roost hacen `throw`
// en error; acá se lanza `Error(json.error)` para no cambiar los try/catch de los componentes.
export async function api<T>(url: string, init?: Omit<RequestInit, "body"> & { body?: unknown }): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error || "Error inesperado");
  return json as T;
}

export const consulta = (params: Record<string, string | number | null | undefined>) => {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== null && v !== undefined) qs.set(k, String(v));
  const texto = qs.toString();
  return texto ? `?${texto}` : "";
};
