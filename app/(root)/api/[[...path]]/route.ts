import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const upstream = () => {
  const base = process.env.DIPLOMAT_API_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error("DIPLOMAT_API_URL is not set");
  }
  return base;
};

async function proxy(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const suffix = path.length ? path.join("/") : "";
  const dest = new URL(`/api/${suffix}`, upstream());
  dest.search = req.nextUrl.search;

  const headers = new Headers();
  req.headers.forEach((v, k) => {
    const lk = k.toLowerCase();
    if (
      lk === "host" ||
      lk === "connection" ||
      lk === "content-length" ||
      lk === "transfer-encoding"
    ) {
      return;
    }
    headers.set(k, v);
  });

  try {
    const { getToken } = await auth();
    const token = await getToken();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
  } catch {
    /* anonymous */
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req.body;
    // @ts-expect-error duplex required for streaming body in Node fetch
    init.duplex = "half";
  }

  const res = await fetch(dest, init);
  const out = new NextResponse(res.body, { status: res.status, statusText: res.statusText });
  res.headers.forEach((v, k) => {
    const lk = k.toLowerCase();
    if (
      lk === "transfer-encoding" ||
      lk === "connection" ||
      lk === "content-encoding"
    ) {
      return;
    }
    out.headers.set(k, v);
  });
  return out;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
export const OPTIONS = async (req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) => {
  const res = await proxy(req, ctx);
  if (!res.headers.has("access-control-allow-methods")) {
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS");
  }
  return res;
};
