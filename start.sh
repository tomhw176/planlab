#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npx tsx prisma/seed.ts || echo "Seed failed or already seeded, continuing..."

echo "Starting server..."
node server.js
