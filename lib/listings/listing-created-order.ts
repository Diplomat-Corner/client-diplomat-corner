/**
 * Newest-first by listing creation time only (aligned with browse API sort).
 * Uses createdAt, then legacy timestamp, then ObjectId time from _id — not updatedAt.
 */

function tryParseTime(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "string" && v.trim() !== "") {
    const t = Date.parse(v);
    return Number.isNaN(t) ? 0 : t;
  }
  if (v instanceof Date) return v.getTime();
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return 0;
}

export function listingCreatedAtMs(item: Record<string, unknown>): number {
  const created = tryParseTime(item.createdAt);
  if (created > 0) return created;
  const stamp = tryParseTime(item.timestamp);
  if (stamp > 0) return stamp;
  const idHex = typeof item._id === "string" ? item._id : "";
  if (idHex.length === 24 && /^[0-9a-fA-F]+$/.test(idHex)) {
    return parseInt(idHex.slice(0, 8), 16) * 1000;
  }
  return 0;
}

function idTieBreakDesc(a: Record<string, unknown>, b: Record<string, unknown>): number {
  const ida = typeof a._id === "string" ? a._id : "";
  const idb = typeof b._id === "string" ? b._id : "";
  return idb.localeCompare(ida);
}

export function sortListingsByCreatedAtFirst<T>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const ra = a as unknown as Record<string, unknown>;
    const rb = b as unknown as Record<string, unknown>;
    const tb = listingCreatedAtMs(rb);
    const ta = listingCreatedAtMs(ra);
    if (tb !== ta) return tb - ta;
    return idTieBreakDesc(ra, rb);
  });
}
