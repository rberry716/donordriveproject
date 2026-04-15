# DonorDrive Platform — Build Plan

## Project Goal
Deploy a production-quality full-stack platform at CMN Dance Marathon events that:
- Displays live donations, totals, and leaderboards on a public projector screen
- Lets the admin control exactly what is shown on the display in real time
- Protects backend access with login and display access with a passcode
- Automatically syncs selected DonorDrive export data into configurable Google Sheets
- Never persists personal donor data in the app's own database

## Real-World Deployment Context
This runs live at a real event in front of real attendees. That means:
- The display is projected in a room — UI must be polished, readable at distance, visually engaging
- A multi-hour event window with no tolerance for crashes or blank screens
- Venue WiFi and DonorDrive API reliability cannot be guaranteed
- Post-event metrics (donations processed, uptime, sync success rate, latency achieved) are quoted on the resume as proof

## Security + Data Policy
- Never persist personal DonorDrive fields (name, email, message, address) in local database
- Process personal fields in-memory only, immediately for display or export, then discard
- Store only non-PII operational data: job config, status, timestamps, counts
- Argon2 password hashing; never store plaintext secrets or passcodes
- All API keys in environment variables only, never in source code
- Sensitive values redacted from all logs
- Short log retention policy

## Stack

### Frontend
- Next.js + React + Tailwind CSS
- Framer Motion for scene transitions and celebration animations
- Socket.IO client for realtime updates and director commands

### Backend
- Node.js + TypeScript + Express or NestJS
- Socket.IO server for realtime hub
- BullMQ + Redis for job scheduling and retry queues
- PostgreSQL + Prisma for auth, config, and operational metadata
- node-cron or BullMQ repeat jobs for interval scheduling

### Infrastructure
- Docker Compose for local development (Postgres, Redis, backend, frontend in one command)
- GitHub Actions CI (lint, typecheck, test, build)
- Render / Railway / Fly.io for production deployment
- Environment-based config with no secrets in source control

## Defined Performance Targets
These are set before build and measured during and after the event:
- Display scene updates delivered within **3 seconds** of a director command
- Live donation data refreshed within **5 seconds** of appearing on DonorDrive
- Sync jobs complete within **30 seconds** of their scheduled interval
- Google Sheets write success rate of **99%+** over the event window
- Zero unrecovered display crashes during the event window
- WebSocket reconnect achieved within **5 seconds** of connection drop

These targets are instrumented (tracked in structured logs and surfaced in the admin dashboard) so they can be reported as proof, not just claims.

## The Hard Engineering Problems (Required, Not Optional)

### 1. Real-Time Rank Diff Engine
Leaderboard positions change with every donation. Naively replacing the full list causes jarring re-renders and loses rank change context. The rank diff engine:
- Computes delta between the previous and current leaderboard snapshot
- Tracks rank direction (up/down/new entry/exit) and magnitude per entity
- Emits a structured diff event over WebSocket rather than a full list replacement
- Frontend animates each row's rank change independently using the diff payload
- Maintains a rolling history window to detect "fastest rising" entries

This is a non-trivial stateful problem with race conditions when two donations arrive near-simultaneously. It requires careful ordering and idempotency on the server side.

### 2. Token Bucket Rate Limiter for DonorDrive API
DonorDrive enforces API rate limits. Under load (multiple sync jobs, live polling, and manual triggers running concurrently), naive fetching will hit limits and cause cascading failures. The token bucket:
- Implements a server-side token bucket shared across all DonorDrive API calls
- Refills at a configured rate based on DonorDrive's documented limits
- Queues requests when the bucket is empty rather than failing them immediately
- Surfaces bucket state (current tokens, requests queued, last refill) in the admin dashboard
- Ensures sync jobs and live polling never compete in a way that starves either

### 3. WebSocket Reconnect Replay Buffer
When the display client disconnects (venue WiFi blip) and reconnects, it must not miss director commands issued during the gap. The replay buffer:
- Maintains a server-side ring buffer of the last N director events with timestamps
- On reconnect, sends the client the most recent scene state plus any commands issued during the gap
- Ensures the display is never in a stale state after a reconnect, regardless of gap length
- Handles the race condition where a new command arrives mid-replay

## Database Scope

### Stores
- `User` — id, email, passwordHash (Argon2), role, createdAt
- `EventPasscode` — id, codeHash, label, expiresAt, active, createdAt
- `DisplayState` — id, activeScene, activeCampaignId, autoCycleEnabled, autoCycleIntervalSec, frozen, updatedAt
- `SceneCycleConfig` — id, sceneOrder, displayStateId
- `SyncJob` — id, campaignId, sheetUrl, tabName, dataType, intervalSec, status, pausedAt, lastRunAt, nextRunAt
- `SyncFieldMapping` — id, syncJobId, sourceField, targetColumn, transformRule
- `SyncCheckpoint` — id, syncJobId, watermark, updatedAt
- `SyncRun` — id, syncJobId, startedAt, finishedAt, status, processedCount, errorSummary
- `AuditLog` — id, actorUserId, action, entityType, entityId, metadata, createdAt
- `PerformanceMetric` — id, metricName, value, recordedAt (for post-event reporting)

### Never Stores
- Donor names, emails, addresses, or messages
- Donation records with any personal identifiers
- Full export rows containing personal fields
- Raw API payloads containing PII

## Feature Set

### Access Control
- Admin login: Argon2 hashed passwords, JWT with refresh token rotation
- Role model: `admin` and `operator` (operator cannot change auth or delete jobs)
- Frontend event passcode gate: hashed storage, per-event codes, optional expiry, rotation UI
- Rate limiting and progressive lockout on all auth endpoints
- CSRF protection and secure HTTP headers

### Director Control Panel (Admin → Display)
Real-time control of what every connected display shows, with sub-3-second delivery guaranteed.

**Scene types:**
- `TOTAL` — campaign total, goal progress ring, percentage complete
- `DONATIONS` — live donation ticker with configurable scroll speed
- `TEAM_LEADERBOARD` — animated rank list with diff-driven rank change arrows
- `PARTICIPANT_LEADERBOARD` — same with participant data
- `MILESTONE` — full-screen celebration triggered manually or automatically
- `ANNOUNCEMENT` — custom text message with configurable font size and duration
- `STANDBY` — branded holding screen for before/after the event

**Controls:**
- One-click scene push to all connected displays
- Auto-cycle mode: select scenes and interval, backend rotates automatically
- Per-scene field visibility toggles (e.g. show/hide donor display name per scene)
- Emergency freeze: halts all updates instantly, holds current frame
- Emergency blank: sends displays to standby immediately
- Connected client count and latency display in the admin panel
- Replay buffer status (last command replayed, gap duration on last reconnect)

### Kiosk Display Frontend
Designed to run on a projector or large screen in a public venue.

- Fullscreen layout, no controls, no user input
- Large readable fonts, high contrast, accessible color palette
- Framer Motion animated scene transitions (crossfade, slide, scale)
- Rank change animations per leaderboard row driven by diff engine (arrow up/down, color flash)
- Goal progress ring with smooth fill animation
- Milestone celebration: full-screen burst with confetti, goal amount, and hold duration
- Subtle reconnecting indicator that does not interrupt the display (corner badge)
- Holds last valid frame during disconnect; never shows blank or error screen
- Optimized for 1080p and 4K output

### Live Data (In-Memory, Never Stored)
All data fetched fresh from DonorDrive REST API, processed in-memory, pushed to display, then discarded:
- Campaign total and progress toward goal
- Recent donation feed (respects DonorDrive privacy/display settings)
- Team and participant leaderboards with rank diff computation
- Milestone detection: automatic `MILESTONE` scene trigger when goal threshold is crossed
- Configurable polling interval with token bucket protection

### Google Sheets Sync Engine
- Add, edit, remove sheet sync targets from admin dashboard
- Select data type: donations, teams, participants, totals snapshots
- Map DonorDrive export fields to sheet columns with optional transform rules
- Set update interval (1, 5, 15, 30, 60 minutes)
- Pause and resume individual jobs independently
- Manual sync trigger with real-time status feedback
- Dry-run preview mode: shows what would be written without touching the sheet
- Idempotent upsert: no duplicate rows on retry or re-run
- Incremental sync with watermark checkpointing (only processes new/changed records)
- Exponential backoff with jitter on failure; dead-letter status after max retries
- Reconciliation report: compare DonorDrive source totals vs sheet totals, surface discrepancies

### Admin Monitoring Dashboard
- Sync job cards: last run, next run, status, records processed, consecutive failure count
- Token bucket status: current capacity, queued requests, request throughput
- Display status: connected clients, active scene, last command sent, last reconnect event
- Latency metrics: live data freshness lag, director command delivery time
- Audit log: paginated, searchable list of all admin actions
- Performance metrics view: rolling charts of sync latency, job success rate, API error rate
- Health endpoints: `/health` (liveness) and `/ready` (readiness with dependency checks)

### Offline + Resilience
- Display holds last valid frame during WebSocket disconnect
- Reconnect replay buffer restores current scene state on reconnect
- BullMQ job queue persists across backend restarts (Redis-backed)
- Token bucket shared state persists in Redis
- Sync jobs retry independently of display state
- Graceful shutdown: completes in-flight jobs before stopping
- Mock DonorDrive server for offline development and demo mode

## Demo Mode
Available from day one of development. Runs without a live DonorDrive event:
- Mock DonorDrive REST API server with configurable response data
- Seed data generator: fake campaigns, teams, participants, and donations
- Donation simulator: sends new mock donations at a configurable rate
- Scenario scripts: "quiet start," "big donation surge," "milestone crossing," "leaderboard flip"
- Demo mode flag in admin panel that switches all clients to mock data source

Demo mode is what you use in every interview technical demo.

## Testing Strategy
- **Unit:** rank diff engine, token bucket, field mapper, reconnect replay buffer, sync scheduler
- **Integration:** sync worker + BullMQ + Prisma + Redis; WebSocket hub event flow
- **E2E:** login → configure sync job → trigger → verify sheet write; login → push scene → verify display receives it
- **Load test:** simulate 10 concurrent display clients + 5 sync jobs running simultaneously
- **Chaos:** drop Redis connection mid-job; disconnect display mid-sync; simulate DonorDrive timeout

## CI / CD Pipeline
- GitHub Actions on every push and PR
- Steps: install, lint, typecheck, unit tests, integration tests, Docker build
- PR preview deployments
- Main branch auto-deploys to production

## Implementation Milestones

### Milestone 1: Foundation + Demo Mode (Build This First)
- Monorepo scaffold: `frontend/`, `backend/`, `docker-compose.yml`, `.github/workflows/`
- PostgreSQL schema + Prisma migrations for full data model
- Admin auth: login, JWT with refresh, role guard
- Frontend passcode gate
- DonorDrive REST API client wrapper with token bucket rate limiter
- Mock DonorDrive server for offline development
- Seed data generator and donation simulator
- One-command local startup

### Milestone 2: Director Control + Live Display
- WebSocket hub with room management
- Reconnect replay buffer implementation
- All display scene components (total, donations, leaderboards, milestone, announcement, standby)
- Director control panel UI (scene switcher, auto-cycle config, freeze, blank)
- Real-time rank diff engine (server-side computation, client-side animation)
- Milestone auto-trigger on goal crossing
- Framer Motion transitions and celebration animation
- Connected client count and latency display in admin

### Milestone 3: Sync Engine + Reconciliation
- BullMQ job scheduler with configurable intervals
- DonorDrive Export API client (with token bucket integration)
- Google Sheets writer: idempotent upsert, incremental watermark sync
- Admin sync config UI (sheet URL, field mapping, interval, pause/resume, dry-run)
- Manual sync trigger with live status feedback
- Reconciliation report: DonorDrive source vs sheet totals comparison

### Milestone 4: Observability + Polish
- Admin monitoring dashboard (sync health, token bucket, display status, latency charts)
- Performance metric instrumentation and storage for post-event reporting
- Audit log UI (paginated, searchable)
- Full offline/resilience hardening (graceful shutdown, mid-job Redis drop recovery)
- Test coverage: unit, integration, E2E, load test
- CI pipeline and production deployment

### Milestone 5: Post-Event Deliverable
- Collect and record all performance metrics during the event (latency, uptime, sync success rate, donations processed)
- Write a technical retrospective: what was built, what happened live, what failed, what was fixed, what would be done differently
- Update README with event photos/screenshots, architecture diagram, and measured outcomes
- Record a walkthrough demo video for portfolio

## Folder Structure
```
donordriveproject/
  frontend/
    app/
      display/          # kiosk display (all scenes)
      admin/            # director control + sync config + monitoring
      gate/             # passcode entry
    components/
      scenes/           # individual scene components
      leaderboard/      # rank diff animated rows
      celebrations/     # milestone animation
    lib/
      socket.ts         # socket.io client + reconnect logic
  backend/
    src/
      auth/             # login, JWT, guards, passcode
      display/          # WebSocket hub, director commands, replay buffer
      donordrive/       # REST client, Export client, token bucket
      sync/             # BullMQ jobs, scheduler, Google Sheets writer
      monitoring/       # metrics, audit log, health endpoints
      db/               # Prisma schema, migrations
    mock/               # mock DonorDrive server + seed data
    test/               # unit, integration, e2e tests
  docker-compose.yml
  .github/
    workflows/
      ci.yml
  PLAN.md
  README.md
```

## Resume Positioning (Post-Event)
- "Deployed and operated live at [Event], maintaining sub-3s director command delivery and sub-5s donation data freshness over [N] hours with zero display crashes"
- "Engineered a real-time rank diff engine that computes leaderboard position deltas server-side and drives per-row animations on a live projector display"
- "Implemented a token bucket rate limiter shared across concurrent DonorDrive API consumers to prevent quota exhaustion under load"
- "Built a WebSocket reconnect replay buffer ensuring display clients restore correct scene state after venue network interruptions"
- "Designed a privacy-first sync pipeline processing DonorDrive export data into Google Sheets without persisting personal donor information"
- "Achieved 99%+ Google Sheets sync success rate across [N] jobs over the event window"
