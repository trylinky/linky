#!/usr/bin/env bash
# Proves the Drizzle baseline reproduces schema.prisma exactly.
#
# Applies packages/db/migrations to an EMPTY database, then asks Prisma to
# diff that database against schema.prisma. A non-empty diff exits 2.
#
# Usage: DIRECT_URL=postgresql://user:pass@localhost:5433/glow_parity ./scripts/check-parity.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -z "${DIRECT_URL:-}" ]; then
  echo "DIRECT_URL must point at an empty scratch database" >&2
  exit 1
fi

# Call drizzle-kit directly (not the dotenvx-wrapped `migrate` package
# script) so there is no ambiguity about which DIRECT_URL it uses: dotenvx
# does not override variables already present in the environment, but
# calling the binary directly removes any doubt.
pnpm exec drizzle-kit migrate

# drizzle-kit's own bookkeeping (the "drizzle"."__drizzle_migrations" table)
# lives in a separate "drizzle" schema that schema.prisma knows nothing
# about. schema.prisma has no `@@schema` attributes and no multiSchema
# preview feature enabled, so Prisma's diff only considers the "public"
# schema and never reports "drizzle" as drift. Documented here rather than
# silenced: if a future Prisma/Drizzle version starts reporting it, drop the
# "drizzle" schema after the migrate step before diffing.

cd ../prisma

pnpm exec prisma migrate diff \
  --from-config-datasource \
  --to-schema prisma/schema.prisma \
  --exit-code

echo "parity ok: drizzle baseline matches schema.prisma"
