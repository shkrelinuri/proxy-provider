#!/bin/bash
set -euo pipefail

cp /etc/squid/squid.conf.template /etc/squid/squid.conf
mkdir -p /var/log/squid /var/spool/squid
squid -z || true

exec squid -N -d 1
