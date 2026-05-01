#!/bin/bash

# Configuration
BACKUP_DIR="/DATA/AppData/MTConnect_V2"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="BACKUP_MTConnect_V2_FULL_$DATE"
TEMP_DIR="/tmp/$BACKUP_NAME"
DB_CONTAINER="db_postgres"
DB_NAME="TN_INFO_DATABASE"
DB_USER="postgres"

echo "Starting Full Backup: $BACKUP_NAME"

# Create temp directory
mkdir -p "$TEMP_DIR"

# 1. Database Backup
echo "Dumping database..."
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$TEMP_DIR/database_dump.sql" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Database dump successful."
else
    echo "❌ Database dump failed. Checking if container is running..."
    docker ps | grep "$DB_CONTAINER"
fi

# 2. Files Backup (excluding node_modules and large caches if any)
echo "Copying files..."
rsync -av --exclude 'node_modules' --exclude '__pycache__' --exclude '.git' --exclude 'postgres_data' "$BACKUP_DIR/" "$TEMP_DIR/files/" > /dev/null

# 3. Compress
echo "Compressing..."
cd /tmp
tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" "$BACKUP_NAME"

# Cleanup
rm -rf "$TEMP_DIR"

echo "================================================="
echo "✅ Backup Completed: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
echo "================================================="
echo "You can now download this file to your computer."
