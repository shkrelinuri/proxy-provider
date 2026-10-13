#!/bin/bash
set -euo pipefail

REFRESH_SECONDS="${CONFIG_REFRESH_SECONDS:-30}"

mkdir -p /usr/local/3proxy/logs

/usr/local/3proxy/generate-config.sh

# Background loop: periodically pull fresh credentials/blocked-ports and reload.
(
  while true; do
    sleep "${REFRESH_SECONDS}"
    /usr/local/3proxy/generate-config.sh || true
  done
) &

exec /usr/local/3proxy/bin/3proxy /usr/local/3proxy/3proxy.cfg
