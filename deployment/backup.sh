#!/usr/bin/env bash
# Take a timestamped backup. Works with local SQLite and hosted PostgreSQL.
# Usage: ./deployment/backup.sh
set -euo pipefail

STAMP="$(date +%Y%m%d-%H%M)"
OUT_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$OUT_DIR"

DB_URL="${DATABASE_URL:-$(grep -E '^DATABASE_URL=' ../source/.env 2>/dev/null | cut -d= -f2- | tr -d '\"')}"

if [[ "$DB_URL" == file:* ]]; then
  DB_FILE="${DB_URL#file:}"
  TARGET="$OUT_DIR/backup-$STAMP.db"
  cp "$DB_FILE" "$TARGET"
  echo "SQLite backup written to $TARGET"
else
  TARGET="$OUT_DIR/backup-$STAMP.sql"
  pg_dump "$DB_URL" --no-owner --clean > "$TARGET"
  gzip "$TARGET"
  echo "PostgreSQL backup written to $TARGET.gz"
fi

echo "Verify with: ./deployment/restore.sh $TARGET --verify"
