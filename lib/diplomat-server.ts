import { auth } from "@clerk/nextjs/server";

function baseURL(): string {
  const b = process.env.DIPLOMAT_API_URL?.replace(/\/$/, "");
  if (!b) {
    throw new Error("DIPLOMAT_API_URL must be set for server-side API calls");
  }
  return b;
}

/** Authenticated fetch to the Go API (bypasses the Next.js /api proxy). */
export async function diplomatServerFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = baseURL() + (path.startsWith("/") ? path : `/${path}`);
  const headers = new Headers(init.headers);
  try {
    const { getToken } = await auth();
    const token = await getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  } catch {
    /* not signed in */
  }
  return fetch(url, { ...init, headers });
}
