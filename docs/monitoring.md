# Monitoring Guide

This guide describes the recommended monitoring and alerting setup for RealWorldClaw production services.

## Health Endpoints

Primary API health check:

- `GET https://realworldclaw-api.fly.dev/health`

Additional probes that may also be useful:

- `GET https://realworldclaw-api.fly.dev/api/v1/health/detailed`
- `GET https://realworldclaw-api.fly.dev/api/v1/readiness`

## UptimeRobot Setup

UptimeRobot is a simple way to add external uptime monitoring for the public API.

### Recommended monitors

| Monitor | URL | Type | Interval |
| --- | --- | --- | --- |
| API Health | `https://realworldclaw-api.fly.dev/health` | HTTP(s) | 5 min |
| API Detailed | `https://realworldclaw-api.fly.dev/api/v1/health/detailed` | HTTP(s) | 5 min |
| API Readiness | `https://realworldclaw-api.fly.dev/api/v1/readiness` | HTTP(s) | 5 min |
| Frontend | `https://realworldclaw.com` | HTTP(s) | 5 min |

### Step-by-step

1. Sign in to [UptimeRobot](https://uptimerobot.com/).
2. Click **Add New Monitor**.
3. Choose **HTTP(s)** monitor type.
4. Set a clear monitor name such as `RealWorldClaw API Health`.
5. Enter the URL `https://realworldclaw-api.fly.dev/health`.
6. Set the check interval to **5 minutes**.
7. Configure at least one alert contact:
   - Email: required baseline
   - Feishu/webhook: recommended for team visibility
8. Save the monitor.
9. Repeat for the detailed health, readiness, and frontend endpoints if desired.

### Recommended UptimeRobot settings

- Trigger alert after **2 consecutive failures** to reduce false positives.
- Enable **recovery notifications**.
- Use a shared alert contact instead of a single personal inbox when possible.
- Keep monitor names consistent with the deployed service names.

## Fly.io Alerts Setup

Fly.io provides built-in metrics and app monitoring for deployed services.

### Dashboard links

- General dashboard: [fly.io/dashboard](https://fly.io/dashboard)
- App monitoring example: `realworldclaw-api` app in Fly.io dashboard

### Step-by-step

1. Open the [Fly.io dashboard](https://fly.io/dashboard).
2. Select the `realworldclaw-api` application.
3. Review the **Monitoring / Metrics** views for:
   - CPU
   - Memory
   - Network
   - Request volume
   - Response errors
4. Enable or configure alert notifications for the production app.
5. Route alerts to the team’s preferred channels (email, chat, webhook, or incident tool if available).
6. Verify that alert recipients can receive both firing and recovery notifications.

### What to watch in Fly.io

- Sudden rise in 5xx errors
- Repeated app restarts
- Memory pressure or OOM events
- Sustained CPU spikes
- Traffic drops to zero during expected active periods

## Sentry Alerting

Sentry is already integrated and should be used for application-level error alerting.

### Recommended setup

1. Open the project in Sentry.
2. Confirm both backend and frontend events are being received.
3. Create alert rules for:
   - New high-frequency exceptions
   - Regression of previously resolved issues
   - Error spikes over a short time window
   - Performance degradation on critical endpoints if tracing is enabled
4. Send alerts to the team’s shared notification channels.

### Suggested Sentry notification priorities

- **Critical**: repeated backend exceptions affecting order creation, auth, or payment-related flows
- **High**: frontend crashes on core user journeys
- **Medium**: noisy but recoverable integration failures
- **Low**: one-off edge-case errors with low user impact

## Recommended Alert Rules

Use these as a practical baseline:

### Availability

- `/health` fails **2 consecutive checks** → alert
- Frontend homepage fails **2 consecutive checks** → alert
- Readiness endpoint fails repeatedly for **10+ minutes** → escalate

### Infrastructure

- Fly.io app restarts multiple times in a short window → alert
- Memory usage remains high for a sustained period → alert
- CPU remains saturated for a sustained period → investigate

### Application errors

- Sentry reports a spike in backend exceptions over baseline → alert
- Any critical route returns repeated 5xx responses → alert
- New regression in production for auth or order flows → alert immediately

## Escalation Suggestions

- Send first alert to shared team email/chat.
- Escalate if unresolved after 15–30 minutes.
- Include runbook links and dashboard URLs in alert descriptions where possible.

## Related Docs

- [README](../README.md)
- [Existing monitoring setup notes](ops/monitoring-setup.md)
