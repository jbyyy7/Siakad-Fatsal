/**
 * Production-ready logger utility
 * Replaces console.log statements with structured logging
 * Can be disabled in production via environment variable
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogEntry {
  level: string;
  timestamp: string;
  message: string;
  data?: unknown;
  context?: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private minLevel: LogLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;

  private formatMessage(level: string, message: string, data?: unknown, context?: string): LogEntry {
    const entry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      message,
    };
    
    if (data !== undefined) entry.data = data;
    if (context) entry.context = context;
    
    return entry;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.minLevel;
  }

  error(message: string, error?: unknown, context?: string): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry = this.formatMessage('ERROR', message, error, context);
    console.error('[ERROR]', entry);
    
    // In production, you can send to monitoring service (e.g., Sentry)
    if (!this.isDevelopment && typeof window !== 'undefined') {
      // Example: Sentry.captureException(error);
    }
  }

  warn(message: string, data?: unknown, context?: string): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = this.formatMessage('WARN', message, data, context);
    console.warn('[WARN]', entry);
  }

  info(message: string, data?: unknown, context?: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = this.formatMessage('INFO', message, data, context);
    console.info('[INFO]', entry);
  }

  debug(message: string, data?: unknown, context?: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = this.formatMessage('DEBUG', message, data, context);
    console.log('[DEBUG]', entry);
  }

  // Utility method for API responses
  apiError(endpoint: string, status: number, error: unknown): void {
    this.error(`API Error: ${endpoint}`, { status, error }, 'API');
  }

  apiSuccess(endpoint: string, status: number, data?: unknown): void {
    this.debug(`API Success: ${endpoint}`, { status, data }, 'API');
  }
}

// Singleton instance
export const logger = new Logger();

// Convenience exports
export const logError = logger.error.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logDebug = logger.debug.bind(logger);
