#!/usr/bin/env python3
"""Squid external_acl_type helper: checks %PORT (the request's destination
port) against the backend's blocked-ports list (SMTP relays, etc.)."""
import os
import sys
import requests

BACKEND_URL = os.environ.get("BACKEND_INTERNAL_URL", "http://backend:4000")
SECRET = os.environ.get("INTERNAL_API_SECRET", "changeme")

sys.stdout.reconfigure(line_buffering=True)

for line in sys.stdin:
    dest_port = line.strip().split(" ")[0]
    try:
        resp = requests.post(
            f"{BACKEND_URL}/internal/auth/check-destination",
            json={"destPort": int(dest_port)},
            headers={"x-internal-secret": SECRET},
            timeout=3,
        )
        allow = resp.ok and resp.json().get("allow") is True
    except (requests.RequestException, ValueError):
        allow = False

    print("OK" if allow else "ERR")
