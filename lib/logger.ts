type LogLevel = "debug" | "info" | "warn" | "error";

const isDevelopment = process.env.NODE_ENV === "development";

/** Minimum ms between logging the same rate-limited key (warn/error). */
const RATE_LIMIT_MS = 60 * 1000; // 1 minute

interface LoggerOptions {
  prefix?: string;
  enabledInProduction?: boolean;
}

/** Tracks last log time per key so we don't spam the same error every second. */
const rateLimitMap = new Map<string, number>();

function getRateLimitKey(level: LogLevel, message: string): string {
  const normalized = message.slice(0, 200).replace(/\s+/g, " ");
  return `${level}:${normalized}`;
}

function shouldRateLimit(level: LogLevel, message: string): boolean {
  if (level !== "warn" && level !== "error") return false;
  const key = getRateLimitKey(level, message);
  const now = Date.now();
  const last = rateLimitMap.get(key) ?? 0;
  if (now - last < RATE_LIMIT_MS) return true;
  rateLimitMap.set(key, now);
  return false;
}

class Logger {
  private prefix: string;
  private enabledInProduction: boolean;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix || "";
    this.enabledInProduction = options.enabledInProduction || false;
  }

  private shouldLog(level: LogLevel): boolean {
    if (isDevelopment) return true;
    if (this.enabledInProduction) return true;
    return level === "error" || level === "warn";
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const prefix = this.prefix ? `[${this.prefix}]` : "";
    return `${timestamp} ${level.toUpperCase()} ${prefix} ${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog("debug")) {
      console.log(this.formatMessage("debug", message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog("info")) {
      console.log(this.formatMessage("info", message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog("warn")) {
      if (shouldRateLimit("warn", message)) return;
      console.warn(this.formatMessage("warn", message), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog("error")) {
      if (shouldRateLimit("error", message)) return;
      console.error(this.formatMessage("error", message), ...args);
    }
  }
}

export const logger = new Logger();

export function createLogger(prefix: string, enabledInProduction = false): Logger {
  return new Logger({ prefix, enabledInProduction });
}

export const apiLogger = createLogger("API");
export const dbLogger = createLogger("DB");
export const webhookLogger = createLogger("Webhook");
export const uploadLogger = createLogger("Upload");
