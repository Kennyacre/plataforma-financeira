#!/bin/bash
# Script de Backup Automático para Google Drive

BACKUP_DIR="/home/kennyacre/plataforma-financeira/backups"
GDRIVE_REMOTE="gdrive:Backups_Financeiro"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

echo "Iniciando backup local..."
cd /home/kennyacre/plataforma-financeira
/usr/bin/python3 py_backup.py

echo "Enviando para o Google Drive..."
# O rclone vai enviar a pasta de backups inteira para o Google Drive
/usr/bin/rclone sync $BACKUP_DIR $GDRIVE_REMOTE -v

echo "Backup concluído: $DATE"
