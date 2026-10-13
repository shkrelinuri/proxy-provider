#!/usr/bin/env python3
"""Squid Basic-auth helper: reads "username password" per line (Squid's Basic
auth helper protocol) and validates against the backend's /internal/auth/validate
endpoint. Writes "OK" or "ERR" per line on stdout."""
import os
import sys
import requests

BACKEND_URL = os.environ.get("BACKEND_INTERNAL_URL", "http://backend:4000")
SECRET = os.environ.get("INTERNAL_API_SECRET", "changeme")

sys.stdout.reconfigure(line_buffering=True)

for line in sys.stdin:
    parts = line.rstrip("\n").split(" ", 1)
    if len(parts) != 2:
        print("ERR")
        continue
    username, password = parts

    try:
        resp = requests.post(
            f"{BACKEND_URL}/internal/auth/validate",
            json={"username": username, "password": password},
            headers={"x-internal-secret": SECRET},
            timeout=3,
        )
        allow = resp.ok and resp.json().get("allow") is True
    except requests.RequestException:
        allow = False

    print("OK" if allow else "ERR")
