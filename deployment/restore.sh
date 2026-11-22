#!/usr/bin/env bash
# Restore a backup into a STAGING database. Production restore requires --force
# AND an explicit staging target, so an accident cannot overwrite live data.
# Usage: ./deployment/restore.sh <backup-file> [--verify] [--force]
set -euo pipefail

FILE="${1:-}"
VERIFY=0
FORCE=0
for arg in "${@:2}"; do
  case "$arg" in
    --verify) VERIFY=1 ;;
    --force) FORCE=1 ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

if [[ -z "$FILE" || ! -f "$FILE" ]]; then
  echo "Usage: $0 <backup-file> [--verify] [--force]" >&2
  exit 1
fi

echo "Backup: $FILE ($(du -h "$FILE" | cut -f1))"

if [[ "$FILE" == *.db ]]; then
  STAGING="${STAGING_DATABASE_URL:-file:./staging.db}"
  if [[ "$STAGING" == file:* ]]; then
    cp "$FILE" "${STAGING#file:}"
  fi
  echo "Restored SQLite backup into staging: $STAGING"
else
  TARGET="${STAGING_DATABASE_URL:-}"
  if [[ -z "$TARGET" ]]; then
    echo "Refusing to restore a PostgreSQL dump without STAGING_DATABASE_URL." >&2
    echo "Set STAGING_DATABASE_URL to a non-production connection string." >&2
    exit 1
  fi
  if [[ "$TARGET" == "$DATABASE_URL" && "$FORCE" != 1 ]]; then
    echo "Refusing to overwrite production. Pass --force only after staging verification." >&2
    exit 1
  fi
  SQL_FILE="$FILE"
  if [[ "$FILE" == *.gz ]]; then
    SQL_FILE="${FILE%.gz}"
    gunzip -c "$FILE" > "$SQL_FILE"
  fi
  if [[ "$VERIFY" == 1 ]]; then
    psql "$TARGET" -v ON_ERROR_STOP=1 -f "$SQL_FILE" > /dev/null
    echo "Verification restore into staging succeeded."
  else
    psql "$TARGET" -v ON_ERROR_STOP=1 -f "$SQL_FILE"
    echo "Restore into staging complete."
  fi
fi
