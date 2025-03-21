#!/usr/bin/env bash
set -e

. ./tests/e2e/env/shared.sh

#Load local env variables if present.
if [[ -f "$E2E_ROOT/config/local.env" ]]; then
	. "$E2E_ROOT/config/local.env"
fi

step "Stopping client containers"
docker compose -f $E2E_ROOT/env/docker-compose.yml down

if [[ "$E2E_USE_LOCAL_SERVER" != false ]]; then
	step "Stopping server containers"
	docker compose -f "$SERVER_PATH/docker-compose.yml" -f "$SERVER_PATH/docker-compose.e2e.yml" down
fi

# Remove auth credentials from the Playwright config.
# This must be kept when we fully migrate.
step "Removing Playwright auth credentials"
rm -rf "$E2E_ROOT/../e2e/.auth"
