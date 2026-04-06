import { NextRequest, NextResponse } from "next/server";

/** Correlates logs when behind proxies (Docker, nginx). */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]!.trim();
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function getOrCreateRequestId(req: NextRequest): string {
  return req.headers.get("x-request-id") ?? crypto.randomUUID();
}

export function logApiEvent(payload: Record<string, unknown>): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      type: "api_request",
      ...payload,
    })
  );
}

/**
 * Wraps a route handler: logs duration, status, and ensures `x-request-id` on the response.
 */
export async function withApiRoute(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const requestId = getOrCreateRequestId(req);
  const path = req.nextUrl.pathname;
  const start = Date.now();
  try {
    const res = await handler(req);
    logApiEvent({
      requestId,
      method: req.method,
      path,
      durationMs: Date.now() - start,
      status: res.status,
    });
    const headers = new Headers(res.headers);
    if (!headers.has("x-request-id")) {
      headers.set("x-request-id", requestId);
    }
    return new NextResponse(res.body, { status: res.status, headers });
  } catch (err) {
    logApiEvent({
      requestId,
      method: req.method,
      path,
      durationMs: Date.now() - start,
      status: 500,
      error: err instanceof Error ? err.message : "unknown",
    });
    throw err;
  }
}
