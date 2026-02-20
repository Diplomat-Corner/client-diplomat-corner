type LogLevel = "debug" | "info" | "warn" | "error";

const isDevelopment = process.env.NODE_ENV === "development";

interface LoggerOptions {
  prefix?: string;
  enabledInProduction?: boolean;
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
      console.warn(this.formatMessage("warn", message), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog("error")) {
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
