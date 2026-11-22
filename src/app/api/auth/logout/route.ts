import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/lib/auth';
import { handle, ok } from '@/lib/response';

export async function POST() {
  return handle(async () => {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
    return ok({ signedOut: true });
  });
}
