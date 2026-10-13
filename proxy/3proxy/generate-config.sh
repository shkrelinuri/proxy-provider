#!/bin/bash
set -euo pipefail

CONFIG_PATH="/usr/local/3proxy/3proxy.cfg"
TEMPLATE_PATH="/usr/local/3proxy/3proxy.cfg.template"
BACKEND_URL="${BACKEND_INTERNAL_URL:-http://backend:4000}"
SECRET="${INTERNAL_API_SECRET:-changeme}"

response=$(curl -fsS -H "x-internal-secret: ${SECRET}" "${BACKEND_URL}/internal/proxy-config") || {
  echo "[generate-config] failed to fetch config from backend, keeping existing config" >&2
  exit 0
}

users_line="users $(echo "$response" | jq -r '.userpass | map("\(.username):CL:\(.password)") | join(" ")')"

deny_ports=""
while IFS= read -r port; do
  deny_ports="${deny_ports}deny * * * ${port}\n"
done < <(echo "$response" | jq -r '.blockedPorts[]')

whitelist_acl=""
while IFS= read -r ip; do
  whitelist_acl="${whitelist_acl}allow * ${ip}\n"
done < <(echo "$response" | jq -r '.whitelist[]')

sed \
  -e "s|__USERS__|${users_line}|" \
  "${TEMPLATE_PATH}" > "${CONFIG_PATH}.tmp"

# Multi-line substitutions handled separately since sed single-line replace can't easily inject newlines.
awk -v deny="$deny_ports" -v wl="$whitelist_acl" '
  { gsub("__DENY_PORTS__", deny); gsub("__WHITELIST_ACL__", wl); print }
' "${CONFIG_PATH}.tmp" > "${CONFIG_PATH}"
rm -f "${CONFIG_PATH}.tmp"

echo "[generate-config] wrote $(wc -l < "${CONFIG_PATH}") lines to ${CONFIG_PATH}"

# Ask a running 3proxy to reload its config in-place, if already running.
if [ -f /usr/local/3proxy/3proxy.pid ]; then
  kill -HUP "$(cat /usr/local/3proxy/3proxy.pid)" 2>/dev/null || true
fi
