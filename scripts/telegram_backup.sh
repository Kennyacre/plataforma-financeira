#!/bin/bash

# Carrega as variaveis do .env
source /home/kennyacre/plataforma-financeira/.env

# Configuracoes
DB_NAME="TN_INFO_DATABASE"
BACKUP_DIR="/home/kennyacre/plataforma-financeira/backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/backup_mtconnect_$TIMESTAMP.sql"
ZIP_FILE="$BACKUP_FILE.zip"
TELEGRAM_ID="6016539904"
BOT_TOKEN="8485787550:AAGQwt7bsSk5Q5MrJk5OgKmt1D4xndBfZlw"

# Cria diretorio de backup se nao existir
mkdir -p $BACKUP_DIR

# 1. Gera o dump do banco de dados (usando o container)
sudo docker exec -t db_postgres pg_dump -U postgres $DB_NAME > $BACKUP_FILE

# 2. Compacta o arquivo
zip -j $ZIP_FILE $BACKUP_FILE

# 3. Envia para o Telegram
curl -F chat_id="$TELEGRAM_ID" -F document=@"$ZIP_FILE" -F caption="📦 Backup Automatico MTConnect V2 - $TIMESTAMP" "https://api.telegram.org/bot$BOT_TOKEN/sendDocument"

# 4. Limpeza (opcional - mantem apenas os ultimos 7 dias localmente)
rm $BACKUP_FILE
find $BACKUP_DIR -name "*.zip" -mtime +7 -exec rm {} \;

echo "Backup concluido e enviado para o Telegram!"
