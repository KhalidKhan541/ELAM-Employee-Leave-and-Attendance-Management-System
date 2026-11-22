/** Fault tolerance: retry transient infrastructure failures only. */

const TRANSIENT_CODES = new Set([
  'P2034', // write conflict / deadlock
  'P1001', // cannot reach database
  'P1002', // connection timed out
  'P1017', // server closed connection
  'SQLITE_BUSY',
  'ECONNRESET',
]);

export function isTransient(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' && TRANSIENT_CODES.has(code);
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  retries = 2,
  delayMs = 100,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransient(error) || attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs * 2 ** attempt));
    }
  }
  throw lastError;
}
