type LogLevel = "debug" | "info" | "warn" | "error";

type Meta = Record<string, unknown> | Error | undefined;

/**
 * Structured logger with component tagging.
 *
 * Usage:
 *   logger.info({ component: "DashboardAPI", orderId }, "Fetched order");
 *   logger.error({ component: "Webhook", error }, "Failed to handle message");
 */
function log(
  level: LogLevel,
  metaOrMessage: Meta | string,
  maybeMessage?: string | Meta,
  maybeMeta?: Meta
) {
  const message =
    typeof metaOrMessage === "string"
      ? typeof maybeMessage === "string"
        ? maybeMessage
        : metaOrMessage
      : typeof maybeMessage === "string"
      ? maybeMessage
      : "";

  const meta =
    typeof metaOrMessage === "string"
      ? typeof maybeMessage === "string"
        ? maybeMeta
        : (maybeMessage as Meta)
      : metaOrMessage;

  const payload = {
    level,
    timestamp: new Date().toISOString(),
    message,
    ...(meta ? { meta: serializeMeta(meta) } : {})
  };

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}

function serializeMeta(meta: Meta) {
  if (!meta) return undefined;
  if (meta instanceof Error) {
    return {
      name: meta.name,
      message: meta.message,
      stack: meta.stack
    };
  }
  return meta;
}

export const logger = {
  debug: (metaOrMessage: Meta | string, message?: string | Meta, meta?: Meta) =>
    log("debug", metaOrMessage, message, meta),
  info: (metaOrMessage: Meta | string, message?: string | Meta, meta?: Meta) =>
    log("info", metaOrMessage, message, meta),
  warn: (metaOrMessage: Meta | string, message?: string | Meta, meta?: Meta) =>
    log("warn", metaOrMessage, message, meta),
  error: (metaOrMessage: Meta | string, message?: string | Meta, meta?: Meta) =>
    log("error", metaOrMessage, message, meta)
};
