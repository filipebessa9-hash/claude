#!/usr/bin/env bash
# Sobe um Postgres efêmero em Docker, aplica stub de auth + migrações + seed,
# e roda os testes de integração de RLS (packages/db/test/rls.test.ts).
set -euo pipefail
cd "$(dirname "$0")/.."

CONTAINER=metalink-rls-pg
PORT="${METALINK_RLS_PORT:-54329}"
# Sobrescreva METALINK_PG_IMAGE se o Docker Hub estiver bloqueado na sua rede
# (ex.: mirror.gcr.io/library/postgres:16-alpine).
PG_IMAGE="${METALINK_PG_IMAGE:-postgres:16-alpine}"

docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER" \
  -e POSTGRES_PASSWORD=postgres \
  -p "$PORT:5432" \
  -v "$PWD/supabase:/sql/supabase:ro" \
  -v "$PWD/scripts:/sql/scripts:ro" \
  "$PG_IMAGE" >/dev/null
trap 'docker rm -f "$CONTAINER" >/dev/null 2>&1 || true' EXIT

echo "Aguardando Postgres..."
for _ in $(seq 1 60); do
  if docker exec "$CONTAINER" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; then break; fi
  sleep 0.5
done
docker exec "$CONTAINER" pg_isready -h 127.0.0.1 -U postgres >/dev/null

run_sql() {
  docker exec "$CONTAINER" psql -v ON_ERROR_STOP=1 -q -U postgres -f "$1"
}

echo "Aplicando stub de auth (somente ambiente de teste)..."
run_sql /sql/scripts/supabase-auth-stub.sql

echo "Aplicando migrações..."
for f in supabase/migrations/*.sql; do
  echo "  - $f"
  run_sql "/sql/$f"
done

echo "Aplicando seed..."
run_sql /sql/supabase/seed.sql

echo "Rodando testes de RLS..."
DATABASE_URL="postgres://postgres:postgres@127.0.0.1:$PORT/postgres" \
  pnpm --filter @metalink/db run test
