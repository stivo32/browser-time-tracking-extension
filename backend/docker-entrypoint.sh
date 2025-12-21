#!/bin/bash
set -e

echo "Creating data directory if it doesn't exist..."
mkdir -p /app/data

echo "Running database migrations..."
alembic upgrade head

echo "Starting application..."
exec "$@"
