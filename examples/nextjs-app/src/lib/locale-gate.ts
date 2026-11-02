/** Pure locale selection for the client example. The page waits for this choice before rendering `t()`. */

export function pickLocale(
  param: string | null,
  valid: ReadonlySet<string>,
  sourceLocale: string
): string {
  return param !== null && valid.has(param) ? param : sourceLocale;
}

/** A newer navigation wins. An older response must not change the visible locale. */
export function isCurrentRequest(mine: number, latest: number): boolean {
  return mine === latest;
}
