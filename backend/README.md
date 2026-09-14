# Luméra Backend

Production-ready REST API for the Luméra e-commerce platform: Node.js, Express, TypeScript, MongoDB/Mongoose.

## Table of contents

- [Architecture](#architecture)
- [Stack](#stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [MongoDB (transactions requirement)](#mongodb-transactions-requirement)
- [Development](#development)
- [Tests](#tests)
- [Seed data](#seed-data)
- [Build](#build)
- [Production](#production)
- [Docker](#docker)
- [API & Swagger](#api--swagger)
- [Authentication](#authentication)
- [RBAC](#rbac)
- [Payments](#payments)
- [SMS / OTP](#sms--otp)
- [Owner new-order email notification](#owner-new-order-email-notification)
- [Uploads](#uploads)
- [API response contract — a deliberate deviation](#api-response-contract--a-deliberate-deviation)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Architecture

```
HTTP Request
     ↓
Route → Middleware (auth/validate/rate-limit) → Controller → Service → Model (Mongoose)
     ↓
MongoDB

Business Service (order/payment) → Integration Layer (interface) → External Provider
```

- `src/routes` — thin route definitions + Zod validation + auth/authorize middleware wiring.
- `src/controllers` — thin HTTP adapters (parse req → call service → shape res). No business logic.
- `src/services` — business logic, transactions, orchestration.
- `src/models` — Mongoose schemas.
- `src/middlewares` — auth, validation, rate limiting, error handling, uploads.
- `src/validators` — Zod schemas per domain.
- `src/integrations/{payment,sms,email}` — provider-agnostic interfaces + adapters. Business
  services never talk to a concrete provider directly.
- `src/utils`, `src/config`, `src/constants`, `src/docs` — cross-cutting concerns.

## Stack

Express, TypeScript (strict), MongoDB/Mongoose, JWT (access + rotating refresh tokens), Zod,
bcryptjs, Helmet, CORS, express-rate-limit, express-mongo-sanitize, hpp, cookie-parser, Multer,
Cloudinary SDK, Swagger (swagger-jsdoc + swagger-ui-express), Winston, Jest + Supertest +
mongodb-memory-server, ESLint (flat config) + Prettier.

## Installation

```bash
npm install
cp .env.example .env   # then fill in real secrets
```

## Configuration

All environment variables are validated at startup with Zod (`src/config/env.ts`) — the process
exits immediately with a clear error if a required variable is missing or malformed. See
`.env.example` for the full list: app/port, MongoDB URI, JWT secrets, cookie secret, payment
gateway placeholders, SMS gateway placeholders, SMTP/owner-notification email settings,
Cloudinary, rate limiting.

`.env` is git-ignored and must never be committed. `.env.example` never contains real secrets.

## MongoDB (transactions requirement)

Order checkout uses a MongoDB **multi-document transaction** (atomic stock reservation + order
creation). Transactions require a **replica set** — a plain standalone `mongod` does not support
them, even for local development with a single node.

- **Local dev**: run Mongo as a single-node replica set, e.g.:
  ```bash
  mongod --replSet rs0 --dbpath ./data
  mongosh --eval "rs.initiate()"
  ```
  or simply use `docker-compose up` (already configured this way — see [Docker](#docker)).
- **MongoDB Atlas**: every Atlas cluster (including the free tier) is already a replica set —
  no extra configuration needed, just point `MONGODB_URI` at it.
- **Tests**: `tests/setup.ts` spins up an ephemeral `MongoMemoryReplSet` automatically.

## Development

```bash
npm run dev     # tsx watch — auto-restarts on change
```

Server listens on `PORT` (default 5000). Health check: `GET /api/health`. Swagger UI:
`GET /api/docs`.

## Tests

```bash
npm test          # runs once (mongodb-memory-server replica set, spun up per suite)
npm run test:watch
```

Covers: auth (register/login/refresh rotation/logout/unauthorized), RBAC (customer/seller/admin
ownership boundaries), product CRUD + pagination/filtering, cart (server-side price/stock
recomputation), checkout (server-computed totals, stock reservation, insufficient-stock
rejection, status transitions), payments (initialization, **webhook idempotency** — the
same event applied twice only takes effect once — failed-payment stock release, refund
authorization), and the owner new-order email notification (sent on success, skipped on
failed/refused payment, never duplicated, order unaffected if the email service is down,
missing `OWNER_NOTIFICATION_EMAIL` handled gracefully).

## Seed data

```bash
npm run seed
```

Wipes and recreates demo data: 1 admin, 1 seller, 1 customer (all password `Demo1234` — clearly
fictional, never use in production), 3 categories, 6 products, 1 delivered order, 1 review.
Credentials are printed to the console after seeding.

## Build

```bash
npm run build    # tsc -> dist/
npm start        # node dist/src/server.js
```

## Production

- `graceful shutdown`: `SIGTERM`/`SIGINT` stop accepting new connections, drain in-flight
  requests, close the Mongo connection, then exit (`src/server.ts`).
- `GET /api/health` reports API + DB status — wire it to Nginx/PM2/Docker/your load balancer.
- Structured JSON logs via Winston, with automatic redaction of secrets/tokens/passwords.
- Centralized error handling — no stack traces leak to the client in production.
- Recommended topology: `Internet → Nginx (TLS) → PM2 (cluster mode) → Node/Express → MongoDB`.

## Docker

```bash
docker compose up --build
```

Starts MongoDB as a single-node replica set (auto-initiated by the `mongodb-init` one-shot
service) plus the backend. Set `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` (and
optionally the payment/SMS/Cloudinary vars) in your shell or a `.env` file before running —
`docker-compose.yml` reads them from the environment.

## API & Swagger

All business routes are versioned under `API_PREFIX` (default `/api/v1`). Interactive docs:
`GET /api/docs`. Key resource groups: `auth`, `users`, `products`, `categories`, `cart`,
`wishlist`, `orders`, `customers/:id/orders`, `coupons`, `payments`, `notifications`, `reviews`,
`admin`, `seller`, `uploads`, `dashboard`.

## Authentication

- **Access token**: short-lived JWT (default 15m), sent as `Authorization: Bearer <token>`.
- **Refresh token**: longer-lived JWT (default 30d), stored **httpOnly, signed cookie**, scoped
  to `${API_PREFIX}/auth`. Never accessible to client-side JS.
- **Rotation**: every `/auth/refresh` call issues a brand-new refresh token and immediately
  revokes the old one server-side (`RefreshToken` collection). Reusing a rotated-out token is
  rejected — this detects token theft.
- **Revocation**: `tokenVersion` on `User` is bumped on password change/reset and admin
  suspension; `authenticate` middleware re-checks it on every request, so a compromised or
  suspended session dies immediately, not just when the access token happens to expire.
  `/auth/logout-all` revokes every session for the current user.

## RBAC

Roles: `admin`, `seller`, `customer`. `authorize(...roles)` gates routes by role, but role alone
is never sufficient for a mutation — every service also checks **resource ownership**:
- A seller can only edit/delete/see-stats-for **their own** products and orders that contain at
  least one of their items (`Order.items[].seller`, `Product.seller`); this is enforced in the
  service layer, not just the route, so it can't be bypassed by hitting the endpoint directly.
- A customer can only see/cancel their own orders.
- Admin bypasses ownership checks entirely.

## Payments

Architecture: `OrderService`/`PaymentService` (business) → `PaymentProvider` interface
(`src/integrations/payment/payment.interface.ts`) → concrete adapter
(`src/integrations/payment/providers/*`). No business code ever imports a concrete provider.

- **`manual` provider** (real, working): `cash_on_delivery` and `bank_transfer` — settled by
  staff, no external API needed.
- **`gateway` provider** (placeholder): card / mobile money / PayPal-style. **No API has been
  invented** — official docs for a Guinea-market provider were not supplied, so this adapter
  throws a clear `PaymentProviderNotConfiguredError` (surfaced to clients as `503
  PAYMENT_METHOD_UNAVAILABLE`) until real credentials/docs are provided. Implement it in
  `gateway.provider.ts` — the rest of the system requires no changes.
- **Idempotency**: webhooks are matched by `transactionId` and de-duplicated by `eventId`
  (`Payment.processedWebhookIds`) — a webhook delivered twice never double-confirms stock or
  double-marks an order paid. Verified by an automated test.
- **Stock safety**: checkout reserves stock atomically inside a transaction
  (`availableStock: { $gte: quantity }` as part of a single `findOneAndUpdate`), so two
  concurrent checkouts can never both win the last unit.

## SMS / OTP

Same interface/adapter pattern as payments (`src/integrations/sms`). `console` provider (real,
logs the OTP — used automatically when `SMS_API_URL` is unset, e.g. dev/test) vs. `http`
provider (placeholder — implement once a real Guinea-market SMS gateway's docs are supplied).
OTPs are hashed at rest, expire after 10 minutes, and are attempt-limited.

## Owner new-order email notification

Same interface/adapter pattern as payments/SMS (`src/integrations/email`), three providers
selected by whichever is configured (`RESEND_API_KEY` > `SMTP_HOST` > `console` fallback):
- `resend` (real, HTTP API — sends over HTTPS/443). **Preferred for any host that blocks
  outbound SMTP ports**, which includes Railway (confirmed: it silently drops all outbound
  traffic to port 587). Configure via `RESEND_API_KEY` (free tier, no card required, see
  https://resend.com) plus `EMAIL_FROM_ADDRESS` / `EMAIL_FROM_NAME`.
- `smtp` (real, nodemailer-based — works with any SMTP server/provider: SendGrid, Mailgun,
  SES, Gmail SMTP, a local relay, ...), only used when `RESEND_API_KEY` is unset. Configure
  via `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASSWORD` /
  `EMAIL_FROM_ADDRESS` / `EMAIL_FROM_NAME`. Connection/greeting/socket timeouts are bounded
  to 4s so a blocked network path fails fast instead of stalling the caller for minutes.
- `console` (real, logs the email instead of sending — used automatically when neither of the
  above is configured, e.g. dev/test).

- **What triggers it**: `OWNER_NOTIFICATION_EMAIL` receives a "Nouvelle commande reçue" email
  (HTML + plain-text fallback) as soon as an order is **successfully and definitively confirmed**:
  - immediately after creation for manual payment methods (`cash_on_delivery`, `bank_transfer`),
    since those never go through an online capture step;
  - on payment **capture** for gateway methods (`card`, `paypal`, `mobile_money`) — either the
    synchronous path in `PaymentService.initializeOrderPayment` or the async
    `PaymentService.applyWebhookEvent` webhook path.
  - It is never sent for a failed order creation, a refused/failed payment, or a cancelled order.
- **Idempotency**: `Order.ownerNotifiedAt` is claimed with a single atomic `findOneAndUpdate`
  before sending — a page refresh, a client retry, or a webhook redelivered for the same order
  can never trigger a second email, even under concurrent calls. See
  `src/services/orderNotification.service.ts`.
- **Never blocks the order**: the notifier is isolated from the checkout/payment transaction and
  swallows its own errors (logged via Winston) — an SMTP outage never fails, rolls back, or
  deletes an order/payment.
- **Retries**: `email.service.ts` retries a transient send failure up to 3 times with a short
  exponential backoff before giving up (and logging).
- **Missing configuration**: if `OWNER_NOTIFICATION_EMAIL` is unset, the notifier logs a warning
  and skips sending — it never throws or blocks checkout. `.env.example` documents every var.
- **Content**: order number, date, customer name/email/phone, shipping address, payment
  method/status, line items (name/qty/unit price/subtotal), subtotal, shipping, discount, total,
  and a link to `FRONTEND_URL/admin/orders/:id`. All customer-controlled fields are HTML-escaped
  before being interpolated into the email (`src/integrations/email/templates/ownerNewOrder.template.ts`).
  Amounts always come from the server-persisted `Order` document, never from client input.

## Uploads

`POST /api/v1/uploads/image` (seller/admin only) — Multer memory storage, 5MB limit, MIME-type
allowlist checked from the actual file stream (never the client-supplied extension). Uploads to
Cloudinary when `CLOUDINARY_*` env vars are set; otherwise falls back to local disk
(`/uploads`, served statically) for development.

## API response contract — a deliberate deviation

The already-existing `frontend/` was inspected before writing any backend code (per rule: never
assume the contract is undefined). Its Axios services do **not** unwrap a `{ success, data }`
envelope — `const { data } = await httpClient.get<Product>(...)` expects `data` to **be** the
resource itself, and its `ApiErrorPayload` type is `{ message, code, fieldErrors? }`. Rather than
impose a generic `{success,message,data}` wrapper that would silently break every existing
frontend service call, this backend matches the frontend's real, already-defined contract:
- Success responses return the resource (or `{ items, pagination }` for lists) directly as the
  JSON body.
- Error responses return `{ message, code, fieldErrors? }` with the appropriate HTTP status.

## Deployment

Ubuntu + Nginx + PM2 + MongoDB Atlas (or a self-hosted replica set) + HTTPS. `pm2 start dist/src/server.js -i max` for cluster mode; point Nginx at it as a reverse proxy and terminate TLS there. Set `FRONTEND_URL` to the real deployed frontend origin — CORS only allows that one origin, never `*`.

## Troubleshooting

- **`Operation buffering timed out` / transactions fail locally**: your MongoDB isn't running as
  a replica set — see [MongoDB](#mongodb-transactions-requirement).
- **502/`ENV VALIDATION ERROR` on boot**: a required env var is missing/invalid — the message
  lists exactly which one; check `.env` against `.env.example`.
- **`PAYMENT_METHOD_UNAVAILABLE` (503) on checkout**: expected for `card`/`paypal`/
  `mobile_money` until a real gateway provider is implemented — use `cash_on_delivery` or
  `bank_transfer` in the meantime.
- **CORS errors from the frontend**: confirm `FRONTEND_URL` exactly matches the frontend's
  origin (scheme + host + port).
