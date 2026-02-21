#!/bin/bash
DB="/Volumes/T7 Shield/realworldclaw/platform/data/realworldclaw.db"
BACKUP_DIR="/Volumes/T7 Shield/realworldclaw/backups"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d-%H%M)
cp "$DB" "$BACKUP_DIR/realworldclaw-$DATE.db"
# 保留最近7天
find "$BACKUP_DIR" -name "*.db" -mtime +7 -delete
echo "Backup done: realworldclaw-$DATE.db"
