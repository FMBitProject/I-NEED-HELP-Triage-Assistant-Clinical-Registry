"use client";

import { useEffect } from "react";

// React error boundaries (error.tsx/global-error.tsx) only catch errors
// during rendering — not errors thrown in event handlers or async code
// (e.g. an unawaited rejected promise in a click handler). This catches
// those remaining cases so they don't stay invisible to the dev team.
function report(message: string, stack?: string) {
  fetch("/api/log-client-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, stack, url: window.location.href }),
  }).catch(() => {});
}

export function ErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      report(event.message, event.error?.stack);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      report(
        reason instanceof Error ? reason.message : String(reason),
        reason instanceof Error ? reason.stack : undefined
      );
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
