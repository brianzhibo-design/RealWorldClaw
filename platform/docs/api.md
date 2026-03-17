# RealWorldClaw API Quick Reference

- OpenAPI (Swagger UI): `/docs`
- ReDoc: `/redoc`
- Base URL prefix: `/api/v1`

## Authentication

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/api/v1/auth/register` | No | Register user |
| POST | `/api/v1/auth/login` | No | Login and get tokens |
| POST | `/api/v1/auth/refresh` | No | Refresh token pair |
| GET | `/api/v1/auth/me` | Bearer JWT | Current user profile |
| PUT | `/api/v1/auth/me` | Bearer JWT | Update profile |
| POST | `/api/v1/auth/change-password` | Bearer JWT | Change password |
| POST | `/api/v1/auth/logout` | Optional | Stateless logout ack |
| DELETE | `/api/v1/auth/me` | Bearer JWT | Hard delete account |
| POST | `/api/v1/auth/github` | No | GitHub OAuth login |
| POST | `/api/v1/auth/google` | No | Google OAuth login |

## GDPR

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/api/v1/gdpr/consent` | Bearer JWT | Read consent flags |
| POST | `/api/v1/gdpr/consent` | Bearer JWT | Update consent flags |
| GET | `/api/v1/gdpr/export` | Bearer JWT | Export personal data |
| DELETE | `/api/v1/gdpr/delete` | Bearer JWT | Soft-delete/anonymize account |

## Health & SLO

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/health` | No | Root health |
| GET | `/api/v1/health` | No | API liveness |
| GET | `/api/v1/health/detailed` | No | Detailed diagnostics |
| GET | `/api/v1/readiness` | No | Readiness probe |
| GET | `/api/v1/health/slo` | No | SLO snapshot |
| GET | `/metrics` | No | Prometheus metrics |
| GET | `/api/v1/stats` | No | Aggregate platform counters |

## WebSocket / Simulator

> WebSocket endpoints are documented via HTTP companion endpoints and usage notes in `/docs`.

| Protocol | Endpoint | Auth | Notes |
|---|---|---|---|
| GET (doc) | `/api/v1/ws/docs` | No | WebSocket auth & channel guide |
| GET (doc) | `/api/v1/ws/simulator` | No | Simulator WS usage guide |
| WS | `/api/v1/ws/simulator` | No | Simulator telemetry stream |
| WS | `/api/v1/ws/printer/{printer_id}` | JWT | Printer channel |
| WS | `/api/v1/ws/orders/{user_id}` | JWT | Order events |
| WS | `/api/v1/ws/notifications/{user_id}` | JWT | Notification events |

## Other API Groups

The platform also exposes these groups under `/api/v1`:

- `agents`
- `components`
- `nodes`
- `orders`
- `files`
- `community`
- `messages`
- `moderation`
- `search`
- `tags`
- `admin`
- `audit`
- `api-keys`
- `developers`
- `makers`
- `spaces`
- `social`
- `proof`
- `match`
- `evolution`

For full schemas, examples, and error responses, use `/docs` or `/redoc`.
