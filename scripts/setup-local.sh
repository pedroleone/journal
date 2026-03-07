#!/usr/bin/env bash
set -e

echo "Waiting for MinIO to be ready..."
until curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; do
  sleep 1
done
echo "MinIO is up."

echo "Creating bucket 'journal'..."
docker compose exec minio mc alias set local http://localhost:9000 localkey localsecret
docker compose exec minio mc mb --ignore-existing local/journal

echo "Running DB migrations..."
pnpm db:push

echo "Local environment ready."
echo "  MinIO console: http://localhost:9001  (localkey / localsecret)"
echo "  Next.js:       pnpm dev"
