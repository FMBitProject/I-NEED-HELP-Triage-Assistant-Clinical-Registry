import { logger } from "@/lib/logger";

// Client-side React errors only ever show up in the visiting doctor's own
// browser console — nobody else ever sees them unless they happen to report
// it. This forwards them into the server logs (visible in Vercel's
// dashboard) so they're not invisible to whoever maintains the app.
export async function POST(request: Request) {
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
