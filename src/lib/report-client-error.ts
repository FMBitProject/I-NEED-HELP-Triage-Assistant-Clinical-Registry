export function reportClientError(error: {
  message: string;
  stack?: string;
  digest?: string;
  url?: string;
}) {
  fetch("/api/log-client-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(error),
  }).catch(() => {});
}
