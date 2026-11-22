// Called by the Vercel build command only. Swaps the committed SQLite
// datasource for the PostgreSQL one. Never run this for local development.
import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const from = resolve('prisma/schema.postgres.prisma');
const to = resolve('prisma/schema.prisma');
copyFileSync(from, to);
console.log('[build] PostgreSQL schema activated.');
