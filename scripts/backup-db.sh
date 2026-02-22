#!/bin/bash
# Daily database backup from Fly.io
# Run: cron 0 3 * * * /path/to/backup-db.sh

BACKUP_DIR="$HOME/Desktop/Realworldclaw/backups"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y-%m-%d_%H%M)

# Download DB from Fly volume via sftp
flyctl ssh console -a realworldclaw-api -C "cat /app/data/realworldclaw.db" > "$BACKUP_DIR/rwc-$DATE.db" 2>/dev/null

if [ -s "$BACKUP_DIR/rwc-$DATE.db" ]; then
  echo "✅ Backup saved: rwc-$DATE.db ($(du -h "$BACKUP_DIR/rwc-$DATE.db" | cut -f1))"
  # Keep only last 7 backups
  ls -t "$BACKUP_DIR"/rwc-*.db | tail -n +8 | xargs rm -f 2>/dev/null
else
  echo "❌ Backup failed"
  rm -f "$BACKUP_DIR/rwc-$DATE.db"
  exit 1
fi
