// Structured logging so errors are searchable in Vercel's function logs
// (Project -> Logs) without needing an external monitoring service.

type LogContext = Record<string, unknown>;

function emit(level: "error" | "warn" | "info", message: string, context?: LogContext) {
  const line = {
    level,
    message,
    time: new Date().toISOString(),
    ...context,
  };
  const out = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  out(JSON.stringify(line));
}

export const logger = {
  error: (message: string, context?: LogContext) => emit("error", message, context),
  warn: (message: string, context?: LogContext) => emit("warn", message, context),
  info: (message: string, context?: LogContext) => emit("info", message, context),
};
