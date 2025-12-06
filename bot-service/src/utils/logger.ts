/* Einfache Logger-Utility, die später z.B. auf ein zentrales Logging-System
 * (Datadog, Loki, CloudWatch etc.) umgestellt werden kann.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

function log(level: LogLevel, message: string, meta?: any) {
  const base = {
    level,
    message,
    timestamp: new Date().toISOString()
  };

  if (meta) {
    // Meta kann z.B. Error-Objekt, Order-ID, Payload etc. enthalten
    console.log(JSON.stringify({ ...base, meta }));
  } else {
    console.log(JSON.stringify(base));
  }
}

export const logger = {
  debug: (msg: string, meta?: any) => log("debug", msg, meta),
  info: (msg: string, meta?: any) => log("info", msg, meta),
  warn: (msg: string, meta?: any) => log("warn", msg, meta),
  error: (msg: string, meta?: any) => log("error", msg, meta)
};
