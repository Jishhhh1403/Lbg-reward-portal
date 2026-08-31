#!/bin/bash
set -e

echo "[ILRP-DB] Initializing database..."

# Run schema
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    \i /docker-entrypoint-initdb.d/schema.sql
EOSQL

echo "[ILRP-DB] Schema created."

# Run seed data
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    \i /docker-entrypoint-initdb.d/seed.sql
EOSQL

echo "[ILRP-DB] Seed data inserted."
echo "[ILRP-DB] Database initialization complete."
