/** Structured, safe logging. Never log credentials or tokens. */

type Level = 'debug' | 'info' | 'warn' | 'error';

function emit(level: Level, message: string, ctx: Record<string, unknown> = {}): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    message,
    ctx: sanitize(ctx),
  });
  if (level === 'error') process.stderr.write(line + '\n');
  else process.stdout.write(line + '\n');
}

const SENSITIVE = /password|secret|token|authorization|cookie/i;

function sanitize(ctx: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(ctx)) {
    out[key] = SENSITIVE.test(key) ? '[redacted]' : value;
  }
  return out;
}

export const logger = {
  debug: (message: string, ctx?: Record<string, unknown>) => emit('debug', message, ctx),
  info: (message: string, ctx?: Record<string, unknown>) => emit('info', message, ctx),
  warn: (message: string, ctx?: Record<string, unknown>) => emit('warn', message, ctx),
  error: (message: string, ctx?: Record<string, unknown>) => emit('error', message, ctx),
};
