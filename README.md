# Proxy Provider Platform

Datacenter proxy provider with a customer dashboard, admin panel, Stripe billing,
Redis-metered usage/rate-limiting, and 3proxy/Squid proxy engines with real credential
and abuse-prevention integration.

## Structure

```
backend/    Node.js + Express + Mongoose API, Redis metering, cron jobs, Stripe webhooks
frontend/   React (Vite) + Tailwind customer dashboard & admin panel
proxy/3proxy/  3proxy image: config generated from backend, refreshed periodically
proxy/squid/   Squid image: real-time external ACL helpers calling the backend per request
docker-compose.yml
```

## Running locally

1. Copy env files and fill in real secrets (Stripe keys, SMTP, JWT secrets):
   ```
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
2. Start everything:
   ```
   docker compose up --build
   ```
3. Seed an admin user and default plans:
   ```
   docker compose exec backend npm run seed
   ```
4. Frontend: http://localhost:5173  Backend API: http://localhost:4000

## Stripe

Create Products/Prices in the Stripe dashboard matching the plans in `backend/src/scripts/seed.js`,
then set `stripePriceId`/`stripeProductId` on each `Plan` via the admin panel. Point a webhook at
`POST /webhooks/stripe` with the events: `checkout.session.completed`, `customer.subscription.*`.

## Proxy auth integration

- `proxy-3proxy`: polls `GET /internal/proxy-config` every `CONFIG_REFRESH_SECONDS` and rewrites
  its local user/password + blocked-port list (3proxy has no HTTP auth callout).
- `proxy-squid`: uses `external_acl_type` helpers that call `POST /internal/auth/validate` and
  `POST /internal/auth/check-destination` on every connection for real-time auth + abuse blocking.
- Both report connection metadata back via `POST /internal/usage/report` for billing/usage charts
  and legally-retained connection logs (`ConnectionLog`, TTL ~13 months).

All `/internal/*` routes require the `x-internal-secret` header (`INTERNAL_API_SECRET`) and should
never be exposed outside the docker network.
