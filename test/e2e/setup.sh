#!/usr/bin/env bash
# Local D1 for browser tests: English Star's schema (sibling checkout) + test family "Tal"/"Noa".
# Usage: test/e2e/setup.sh [english-star dir] [d1 dir]   then: npx wrangler dev --local --persist-to <d1 dir> --port 8799
set -euo pipefail
ES=${1:-../english-star}; D1=${2:-.wrangler/e2e-d1}
rm -rf "$D1"; mkdir -p "$D1"
for f in "$ES"/migrations/*.sql; do npx wrangler d1 execute english-star --local --persist-to "$D1" --file "$f" >/dev/null; done
node test/e2e/seed.mjs > "$D1/seed.sql"
npx wrangler d1 execute english-star --local --persist-to "$D1" --file "$D1/seed.sql" >/dev/null
echo "ready: $D1 (kid code 123456 for Tal)"
