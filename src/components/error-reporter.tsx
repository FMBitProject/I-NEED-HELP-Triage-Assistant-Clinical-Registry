"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/report-client-error";

// React error boundaries (error.tsx/global-error.tsx) only catch errors
// during rendering — not errors thrown in event handlers or async code
// (e.g. an unawaited rejected promise in a click handler). This catches
// those remaining cases so they don't stay invisible to the dev team.
export function ErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportClientError({ message: event.message, stack: event.error?.stack, url: window.location.href });
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      reportClientError({
        message: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
        url: window.location.href,
      });
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
