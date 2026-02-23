#!/bin/bash
# RealWorldClaw database backup script
# Run via cron: 0 */6 * * * /app/scripts/backup.sh

set -euo pipefail

DB_PATH="${DB_PATH:-/app/data/realworldclaw.db}"
BACKUP_DIR="${BACKUP_DIR:-/app/data/backups}"
RETAIN_DAYS=7

mkdir -p "$BACKUP_DIR"

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/rwc_${DATE}.db"

# Use SQLite online backup API (safe even during writes)
python3 -c "
import sqlite3, shutil, sys
src = sqlite3.connect('${DB_PATH}')
dst = sqlite3.connect('${BACKUP_FILE}')
src.backup(dst)
dst.close()
src.close()
print(f'Backup created: ${BACKUP_FILE}')
"

# Remove backups older than RETAIN_DAYS
find "$BACKUP_DIR" -name "rwc_*.db" -mtime +${RETAIN_DAYS} -delete

echo "Backup complete. Retained last ${RETAIN_DAYS} days."
