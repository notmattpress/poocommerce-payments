#!/usr/bin/env bash
set -e

. ./tests/e2e/env/shared.sh

#Load local env variables if present.
if [[ -f "$E2E_ROOT/config/local.env" ]]; then
	. "$E2E_ROOT/config/local.env"
fi

step "Starting client containers"
docker compose -f "$E2E_ROOT/env/docker-compose.yml" up -d

if [[ "$E2E_USE_LOCAL_SERVER" != false ]]; then
	step "Starting server containers"
	docker compose -f "$E2E_ROOT/deps/transact-platform-server/docker-compose.yml" up -d
fi
