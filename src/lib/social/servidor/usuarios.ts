// Lane 276 (D11, D12): lo que el front de OpenCircle pide a `users/` (menciones y perfil). En Ordo los
// usuarios son los integrantes de la familia; el «username» sale del nombre (usernameDe).
import prisma from "@/lib/prisma";
import { NoEncontradoError } from "@/lib/habitos/server";
import { usernameDe } from "@/lib/social/permisos";
import { aUsuarioDTO, usuarioSelect, type UserDTO } from "./dto";

const sinTildes = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** users.getAll(skip, limit, query): la familia, filtrada por nombre o username. */
export async function listarUsuarios(skip: number, limit: number, query?: string): Promise<UserDTO[]> {
  const todos = await prisma.usuario.findMany({ select: usuarioSelect, orderBy: { id: "asc" } });
  const q = query ? sinTildes(query.trim()) : "";
  return todos
    .filter((u) => !q || sinTildes(u.nombre).includes(q) || usernameDe(u.nombre).includes(q))
    .slice(skip, skip + limit)
    .map(aUsuarioDTO);
}

/** users.getByUsername(username). Con usernames repetidos gana el id menor (D12). */
export async function usuarioPorUsername(username: string): Promise<UserDTO> {
  const todos = await prisma.usuario.findMany({ select: usuarioSelect, orderBy: { id: "asc" } });
  const u = todos.find((x) => usernameDe(x.nombre) === username.toLowerCase());
  if (!u) throw new NoEncontradoError("Usuario no encontrado");
  return aUsuarioDTO(u);
}
