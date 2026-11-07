// Compatibilidad mínima con la API de vitest que usan los tests portados de dovli (lane 271),
// sobre node:test. Solo los matchers que esos tests usan; sin `.not`.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

export { describe, it };

/** Como `toEqual` de vitest: las propiedades con valor `undefined` no cuentan. */
function sinIndefinidos(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sinIndefinidos);
  if (v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype) {
    const fuera: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) if (x !== undefined) fuera[k] = sinIndefinidos(x);
    return fuera;
  }
  return v;
}

/** Como `toMatchObject` de vitest: `esperado` es un subconjunto de `real` (los arrays, elemento a elemento). */
function contiene(real: unknown, esperado: unknown): boolean {
  if (Array.isArray(esperado)) {
    return Array.isArray(real) && real.length === esperado.length && esperado.every((e, i) => contiene(real[i], e));
  }
  if (esperado && typeof esperado === "object") {
    if (!real || typeof real !== "object") return false;
    return Object.entries(esperado).every(([k, e]) => contiene((real as Record<string, unknown>)[k], e));
  }
  return Object.is(real, esperado);
}

export function expect(real: unknown, mensaje?: string) {
  return {
    toBe: (esperado: unknown) => assert.strictEqual(real, esperado, mensaje),
    toEqual: (esperado: unknown) => assert.deepStrictEqual(sinIndefinidos(real), sinIndefinidos(esperado)),
    toMatchObject: (esperado: unknown) =>
      assert.ok(contiene(real, esperado), `toMatchObject: ${JSON.stringify(real)} no contiene ${JSON.stringify(esperado)}`),
    toBeNull: () => assert.strictEqual(real, null),
    toBeUndefined: () => assert.strictEqual(real, undefined),
    toBeTruthy: () => assert.ok(real),
    toBeGreaterThan: (n: number) => assert.ok((real as number) > n, `${String(real)} no es mayor que ${n}`),
    toBeLessThan: (n: number) => assert.ok((real as number) < n, `${String(real)} no es menor que ${n}`),
    toHaveLength: (n: number) => assert.strictEqual((real as { length: number }).length, n),
    toContain: (x: unknown) =>
      assert.ok(
        typeof real === "string" ? real.includes(String(x)) : (real as unknown[]).includes(x),
        `${JSON.stringify(real)} no contiene ${JSON.stringify(x)}`,
      ),
    toMatch: (re: RegExp | string) => assert.match(String(real), typeof re === "string" ? new RegExp(re) : re),
  };
}
