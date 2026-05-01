#!/bin/bash

# Script para gerenciar o ambiente Beta (MTConnect Beta)

BETA_DIR="/DATA/AppData/MTConnect_V2/beta_env"

function usage() {
    echo "Uso: ./gerenciar_beta.sh [comando]"
    echo "Comandos:"
    echo "  start     - Inicia o ambiente Beta"
    echo "  stop      - Para o ambiente Beta"
    echo "  restart   - Reinicia o ambiente Beta (aplica mudanças de código)"
    echo "  status    - Mostra o status dos containers Beta"
    echo "  logs      - Mostra os logs do app Beta"
}

case "$1" in
    start)
        cd $BETA_DIR && docker compose up -d
        ;;
    stop)
        cd $BETA_DIR && docker compose down
        ;;
    restart)
        cd $BETA_DIR && docker compose restart mtconnect_app_beta
        ;;
    status)
        cd $BETA_DIR && docker compose ps
        ;;
    logs)
        cd $BETA_DIR && docker compose logs -f mtconnect_app_beta
        ;;
    *)
        usage
        ;;
esac
