#!/bin/bash
# =============================================================
# clone_db_oficial_para_beta.sh
# Clona o banco TN_INFO_DATABASE (oficial) para o banco beta
# =============================================================

set -e

PROD_CONTAINER="db_postgres"
PROD_DB="TN_INFO_DATABASE"
PROD_USER="postgres"

BETA_CONTAINER="db_postgres_beta"
BETA_DB="TN_INFO_BETA"
BETA_USER="postgres"

DUMP_FILE="/tmp/clone_prod_$(date +%Y%m%d_%H%M%S).sql"

echo ""
echo "============================================="
echo "  CLONAGEM DO BANCO OFICIAL → BETA"
echo "============================================="
echo ""

# 1. Verificar containers
echo "📦 Verificando containers..."
docker ps --format "{{.Names}}: {{.Status}}" | grep -E "db_postgres|mtconnect"
echo ""

# 2. Criar dump do banco oficial
echo "📤 Criando dump do banco oficial ($PROD_DB)..."
docker exec $PROD_CONTAINER pg_dump -U $PROD_USER --clean --if-exists -d $PROD_DB > "$DUMP_FILE"
echo "  ✅ Dump criado: $DUMP_FILE ($(du -h $DUMP_FILE | cut -f1))"
echo ""

# 3. Verificar se o banco beta existe, criar se não existir
echo "🔍 Verificando banco beta ($BETA_DB)..."
BETA_EXISTS=$(docker exec $BETA_CONTAINER psql -U $BETA_USER -tAc "SELECT 1 FROM pg_database WHERE datname='$BETA_DB'" 2>/dev/null || echo "0")

if [ "$BETA_EXISTS" != "1" ]; then
    echo "  🆕 Banco não existe, criando $BETA_DB..."
    docker exec $BETA_CONTAINER psql -U $BETA_USER -c "CREATE DATABASE \"$BETA_DB\";"
    echo "  ✅ Banco criado."
else
    echo "  ✅ Banco já existe, dados serão substituídos."
fi
echo ""

# 4. Copiar o dump para dentro do container beta e restaurar
echo "📥 Restaurando dump no banco beta..."
docker cp "$DUMP_FILE" ${BETA_CONTAINER}:/tmp/restore.sql
docker exec $BETA_CONTAINER psql -U $BETA_USER -d "$BETA_DB" -f /tmp/restore.sql > /dev/null 2>&1 && echo "  ✅ Restauração concluída!" || echo "  ⚠️  Restauração com avisos (normal para drops de objetos inexistentes)"
echo ""

# 5. Verificar resultado
echo "📊 Verificando resultado no banco beta..."
docker exec $BETA_CONTAINER psql -U $BETA_USER -d "$BETA_DB" -c "
SELECT 'usuarios' as tabela, COUNT(*) as registros FROM usuarios
UNION ALL
SELECT 'financas', COUNT(*) FROM financas
UNION ALL
SELECT 'cartoes', COUNT(*) FROM cartoes;
"
echo ""

# 6. Limpar
rm -f "$DUMP_FILE"
docker exec $BETA_CONTAINER rm -f /tmp/restore.sql

echo "============================================="
echo "  CLONAGEM CONCLUÍDA COM SUCESSO! ✅"
echo "  Banco $PROD_DB → $BETA_DB"
echo "============================================="
echo ""
