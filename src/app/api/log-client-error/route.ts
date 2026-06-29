import { logger } from "@/lib/logger";

// Unauthenticated by necessity (errors can happen before login), which also
// makes it an open target for log-flooding. Throttle per IP so it can't be
// used to drown out real signal.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_PER_WINDOW;
}

// Client-side React errors only ever show up in the visiting doctor's own
// browser console — nobody else ever sees them unless they happen to report
// it. This forwards them into the server logs (visible in Vercel's
// dashboard) so they're not invisible to whoever maintains the app.
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.message !== "string") {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  logger.error("client_error", {
    message: String(body.message).slice(0, 1000),
    stack: typeof body.stack === "string" ? body.stack.slice(0, 3000) : undefined,
    digest: typeof body.digest === "string" ? body.digest.slice(0, 200) : undefined,
    url: typeof body.url === "string" ? body.url.slice(0, 500) : undefined,
  });

  return Response.json({ success: true });
}
