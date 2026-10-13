#!/usr/bin/env python3
"""Squid external_acl_type helper: checks %SRC against the backend's IP
whitelist credentials, so whitelisted customers can skip username/password."""
import os
import sys
import requests

BACKEND_URL = os.environ.get("BACKEND_INTERNAL_URL", "http://backend:4000")
SECRET = os.environ.get("INTERNAL_API_SECRET", "changeme")

sys.stdout.reconfigure(line_buffering=True)

for line in sys.stdin:
    src_ip = line.strip().split(" ")[0]
    try:
        resp = requests.post(
            f"{BACKEND_URL}/internal/auth/validate",
            json={"sourceIp": src_ip},
            headers={"x-internal-secret": SECRET},
            timeout=3,
        )
        allow = resp.ok and resp.json().get("allow") is True
    except requests.RequestException:
        allow = False

    print("OK" if allow else "ERR")
