# Development Roadmap

Each step is listed in the order it must be completed.
A step marked with a dependency cannot be started until that dependency is done.

---

## Before You Write Any Code

- [ ] Run `docker compose up -d` from the project root to start Postgres and Redis
- [ ] Run `npm run db:migrate` from `backend/` to create all database tables from the Prisma schema
- [ ] Confirm both containers are healthy with `docker ps`

---

## Milestone 1 — Foundation

### Step 1 — Logger
**File:** `backend/src/monitoring/logger.ts`
**Depends on:** nothing
- Create a Winston logger instance
- Format: timestamp + level + message + metadata
- In production mode output JSON; in dev mode output human-readable colored text
- Redact any object key whose name contains: password, hash, token, secret, code, key
- Export as `logger`

---

### Step 2 — Prisma Client
**File:** `backend/src/db/prisma.ts`
**Depends on:** Step 1 (logger), database tables created
- Create a single PrismaClient instance
- Prevent multiple instances from being created during hot-reload
- Export as `prisma`

---

### Step 3 — Auth Service
**File:** `backend/src/auth/auth.service.ts`
**Depends on:** Step 2
- `hashPassword(password)` — Argon2 hash
- `loginUser(email, password)` — look up user, verify hash, return user + tokens or null
- `issueTokens(payload)` — sign access token (15m) and refresh token (7d) with separate secrets
- `verifyAccessToken(token)` — verify and decode, throw on invalid/expired
- `verifyRefreshToken(token)` — same for refresh token
- `refreshTokens(refreshToken)` — verify refresh, look up user, return new token pair
- `verifyPasscode(code)` — check against all active, non-expired EventPasscode rows using Argon2

---

### Step 4 — Auth Middleware
**File:** `backend/src/auth/auth.middleware.ts`
**Depends on:** Step 3
- `requireAuth` — extract Bearer token from Authorization header, call verifyAccessToken, attach payload to `req.user`, return 401 on failure
- `requireRole(...roles)` — check `req.user.role` against allowed roles, return 403 on failure

---

### Step 5 — Auth Router
**File:** `backend/src/auth/auth.router.ts`
**Depends on:** Steps 3 and 4
- Apply rate limiting to all auth routes (max 10 requests per 15 minutes per IP)
- `POST /login` — validate email + password, call loginUser, write AuditLog on success, return tokens
- `POST /refresh` — call refreshTokens, return new token pair
- `POST /passcode` — validate code input, call verifyPasscode, return 200 or 401
- `GET /me` — requireAuth, return req.user

---

### Step 6 — Backend Entry Point
**File:** `backend/src/index.ts`
**Depends on:** Step 5
- Load dotenv
- Create Express app and HTTP server
- Attach Socket.IO to the HTTP server with CORS set to FRONTEND_URL
- Register Helmet and CORS middleware
- Mount auth router at `/api/auth`
- Add `GET /health` → `{ status: "ok" }`
- Add `GET /ready` → query DB with `SELECT 1`, return 200 or 503
- Define WebSocket connection handler: on `join:display` add socket to "display" room, on `join:admin` add to "admin" room
- Start listening on PORT (default 4000)
- Export `io` for use by other modules

**Checkpoint:** `npm run dev` from `backend/` starts the server. Test `/health` in a browser.

---

### Step 7 — Seed Script
**File:** `backend/scripts/seed.ts`
**Depends on:** Steps 2 and 3
- Load dotenv
- If no User with ADMIN role exists, create one using SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD env vars
- If no DisplayState row exists, create one with `layoutTemplate: FULL_SCREEN` and `slots: [{ type: "pinned", scene: "STANDBY" }]`
- If no EventPasscode rows exist, create a demo passcode using Argon2 hash
- Print what was created and remind the user to change the password
- Run with `npm run seed` from `backend/`

**Checkpoint:** Run seed, then open Prisma Studio (`npm run db:studio`) and confirm the rows exist.

---

### Step 8 — Mock Data
**File:** `backend/mock/data.ts`
**Depends on:** nothing (pure data)
- Define and export `MOCK_CAMPAIGN` object
- Define and export `MOCK_TEAMS` array (8 teams with name, pledges, members, donations)
- Define and export `MOCK_PARTICIPANTS` array (8 participants with name, team, pledges)
- Define and export `MOCK_DONATIONS` array (30 pre-generated donations with realistic timestamps)
- Export `generateDonation(overrides?)` — creates a new randomized donation object, increments a counter for unique IDs

---

### Step 9 — Mock Server
**File:** `backend/mock/server.ts`
**Depends on:** Step 8
- Express server on port 4001
- Keep campaign, teams, participants, donations in module-level mutable state (copied from mock data)
- `GET /api/campaign/:id` — return campaign state
- `GET /api/campaign/:id/donations?limit=N` — return most recent N donations, most recent first
- `GET /api/campaign/:id/teams` — return teams sorted by sumPledges descending
- `GET /api/campaign/:id/participants` — return participants sorted by sumPledges descending
- `POST /simulate/donation` — call generateDonation, add to state, update campaign total and team/participant totals, log to console
- `POST /simulate/reset` — reset all state back to original mock data
- `GET /status` — return current donation count and total raised
- Auto-call generateDonation every 20 seconds when AUTO_SIMULATE is not "false"

**Checkpoint:** `npm run mock` from `backend/`, then visit `http://localhost:4001/status` in a browser.

---

### Step 10 — Token Bucket
**File:** `backend/src/donordrive/token-bucket.ts`
**Depends on:** nothing
- `TokenBucket` class with constructor options: `capacity` and `refillRatePerSecond`
- Internal state: `tokens`, `lastRefillTime`, `queue` (array of resolve functions)
- `refill()` — private, compute elapsed time since last refill, add tokens up to capacity
- `acquire()` — public async method: call refill, if tokens >= 1 and queue is empty consume one token and return immediately; otherwise push a resolver onto the queue and schedule a drain
- `scheduleRefillDrain()` — private, setTimeout based on ms-per-token, call refill then drain queue, reschedule if queue still has items
- `drainQueue()` — private, consume tokens and resolve queued promises until tokens run out
- `getStatus()` — return `{ tokens, capacity, queuedRequests, refillRatePerSecond }`
- Export `donorDriveBucket` singleton with capacity 10, refill rate 2/sec

**Note:** Test this in isolation before moving on. Write a quick script that fires 20 acquire() calls at once and confirm they resolve at ~2/sec after the first 10.

---

### Step 11 — DonorDrive Client
**File:** `backend/src/donordrive/donordrive.client.ts`
**Depends on:** Steps 1 and 10
- Private `apiFetch<T>(path, params?)` — call `donorDriveBucket.acquire()` first, then fetch, handle non-200 responses by logging and throwing
- Base URL comes from `MOCK_SERVER_URL` when `USE_MOCK=true`, otherwise `DONORDRIVE_API_BASE_URL`
- Include Authorization header when `DONORDRIVE_API_KEY` is set
- Export `donorDriveClient` object with:
  - `getCampaign(campaignId)`
  - `getDonations(campaignId, limit?)`
  - `getTeams(campaignId)`
  - `getParticipants(campaignId)`
  - `getBucketStatus()` — returns token bucket status for admin dashboard

**Checkpoint:** With mock server running, call `donorDriveClient.getCampaign("demo-2025")` and confirm it returns mock data.

---

## Milestone 2 — Live Display + Director Control

### Step 12 — Rank Diff Engine
**File:** `backend/src/display/rank-diff.ts`
**Depends on:** nothing (pure logic)
- Define types: `RankedEntry { id, name, amount }` and `RankDelta { id, name, prevRank, newRank, direction, magnitude }`
- `computeRankDiff(previous: RankedEntry[], current: RankedEntry[])` — return array of RankDelta objects
  - direction: "up" | "down" | "same" | "new" | "dropped"
  - magnitude: absolute difference in rank positions
  - Entries in current but not previous get direction "new"
  - Entries in previous but not current get direction "dropped"
- `RollingLeaderboardHistory` class — keeps last N snapshots
  - `push(snapshot: RankedEntry[])` — add snapshot, trim to max size
  - `getFastestRising(topN)` — compare oldest and newest snapshot, return top N entries by rank improvement
- Export both

**Note:** This is the hardest algorithmic piece. Write unit tests for it before wiring it anywhere. Test edge cases: tie scores, new entries, dropped entries, identical snapshots.

---

### Step 13 — Display Hub
**File:** `backend/src/display/display.hub.ts`
**Depends on:** Steps 6 and 12
- Import `io` from `index.ts`
- Replay buffer: module-level array capped at 20 events, each with `{ seq, event, payload, timestamp }`
- `pushScene(scene, payload?)` — increment sequence counter, add to replay buffer, emit `director:scene` to "display" room
- `pushFreeze(frozen)` — emit `director:freeze` to "display" room
- On socket reconnect in "display" room — detect via reconnect flag or sequence acknowledgment, send replay buffer since last known sequence
- `getConnectedDisplayCount()` — return `io.sockets.adapter.rooms.get("display")?.size ?? 0`
- `getLastEvent()` — return most recent replay buffer entry

---

### Step 14 — Display Router
**File:** `backend/src/display/display.router.ts`
**Depends on:** Steps 4, 5, and 13
- All routes require `requireAuth`
- `GET /display/state` — return current DisplayState from DB
- `PATCH /display/state` — update DisplayState fields (layoutTemplate, slots, progressBarType, progressBarGoal, progressBarStartTime, progressBarEndTime, activeCampaignId, autoCycleEnabled, autoCycleIntervalSec, showDonorNames), write AuditLog
  - Validate slot count matches the chosen template (1 for FULL_SCREEN, 3 for THREE_COLUMN, 2 for MAIN_SIDEBAR)
  - Validate progressBarType, progressBarGoal, progressBarStartTime, and progressBarEndTime are set only for `_BAR` templates
- `POST /display/override` — take `{ scene, payload? }`, set activeOverride to show a full-screen scene (MILESTONE, ANNOUNCEMENT), emit to displays, write AuditLog, return 200
- `DELETE /display/override` — clear activeOverride, return displays to configured layout, write AuditLog
- `POST /display/freeze` — toggle frozen state, call `pushFreeze()`, write AuditLog
- `GET /display/status` — return connected display count and last event from hub

---

### Step 15 — Live Data Polling
**File:** `backend/src/display/display.poller.ts` (new file)
**Depends on:** Steps 11 and 13
- On a configurable interval (default 5 seconds), fetch campaign + donations + teams + participants from DonorDrive client
- Run teams and participants through `computeRankDiff` to generate deltas
- Emit `live:campaign`, `live:donations`, `live:teams`, `live:participants` events to "display" room via Socket.IO
- Detect when `totalRaisedAmount` crosses a milestone threshold and emit `live:milestone`
- Start/stop polling based on whether any display clients are connected

---

### Step 16 — Frontend Socket Client
**File:** `frontend/lib/socket.ts`
**Depends on:** Step 6 (backend running)
- Create Socket.IO client pointing to `NEXT_PUBLIC_SOCKET_URL`
- `autoConnect: false`, reconnection enabled, delay 1s, max delay 5s
- `connectDisplay()` — connect if not connected, emit `join:display`, return socket
- `connectAdmin(token)` — set `socket.auth = { token }`, connect, emit `join:admin`, return socket
- `disconnectSocket()` — disconnect and null the singleton

---

### Step 17 — Frontend Layout and Gate
**Files:** `frontend/app/layout.tsx`, `frontend/app/page.tsx`, `frontend/app/gate/page.tsx`
**Depends on:** Steps 6 and 7 (backend + seed running so passcode endpoint works)
- `layout.tsx`: import globals.css, set metadata title "Dance Marathon Live"
- `page.tsx`: redirect "/" to "/gate" using Next.js redirect
- `gate/page.tsx`:
  - Password input centered on dark background
  - On submit POST `/api/auth/passcode`
  - On success set `sessionStorage.passcode_verified = "true"` and redirect to `/display`
  - On failure show error message, clear input
  - Rate limited by backend, show "too many attempts" message on 429

---

### Step 18 — Admin Login
**File:** `frontend/app/admin/page.tsx`
**Depends on:** Step 6
- Email + password form on dark background
- POST `/api/auth/login`
- On success store `access_token`, `refresh_token`, `user` in localStorage, redirect to `/admin/dashboard`
- On failure show error from response body

---

### Step 19 — StandbyScene + Display Shell
**Files:** `frontend/app/display/page.tsx`, `frontend/components/scenes/StandbyScene.tsx`
**Depends on:** Steps 16 and 17
- `display/page.tsx`:
  - Check `sessionStorage.passcode_verified` on mount, redirect to `/gate` if missing
  - Call `connectDisplay()`
  - Listen for `director:layout` events, update layout template + slots in state
  - Listen for `director:override` events, show full-screen override scene (MILESTONE, ANNOUNCEMENT)
  - Listen for `director:freeze` events, freeze display in place
  - Render layout template grid, filling each slot from the slots array (pinned or rotating)
  - If a `_BAR` template is active, render the progress bar at the bottom tracking progressBarType
  - Rotating slots cycle based on autoCycleIntervalSec
  - If activeOverride is set, ignore the layout and render that scene full-screen
  - On disconnect hold current frame, show subtle pulsing indicator in corner
  - Apply `kiosk` CSS class to root element (no cursor, no text selection)
- `StandbyScene.tsx`: fullscreen dark background, event name, pulsing dot

---

### Step 20 — TotalScene
**File:** `frontend/components/scenes/TotalScene.tsx`
**Depends on:** Step 19
- Subscribe to `live:campaign` socket events
- Display total raised as large dollar amount
- Animated SVG or CSS progress ring filling toward goal
- Show percentage and goal amount below ring
- Smooth number increment animation when total changes (count up, not instant jump)

---

### Step 21 — DonationsScene
**File:** `frontend/components/scenes/DonationsScene.tsx`
**Depends on:** Step 19
- Subscribe to `live:donations` socket events
- Show a vertically scrolling list of recent donations
- Each row: display name, amount, time ago
- New donations animate in from the top and push older ones down
- Configurable max visible rows

---

### Step 22 — RankRow + Leaderboard Scenes
**Files:** `frontend/components/leaderboard/RankRow.tsx`, `frontend/components/scenes/TeamLeaderboardScene.tsx`, `frontend/components/scenes/ParticipantLeaderboardScene.tsx`
**Depends on:** Steps 19 and 12
- `RankRow.tsx`:
  - Props: rank, name, amount, direction, magnitude
  - Flash green background on "up", red on "down", neutral on "same"/"new"
  - Show directional arrow (↑ / ↓) and magnitude number beside rank
  - Use Framer Motion for background flash and row slide animation
- `TeamLeaderboardScene.tsx`: subscribe to `live:teams`, render list of RankRow components using diff data
- `ParticipantLeaderboardScene.tsx`: same pattern using `live:participants`

---

### Step 23 — AnnouncementScene
**File:** `frontend/components/scenes/AnnouncementScene.tsx`
**Depends on:** Step 19
- Receives message text and optional font size via scene payload from director
- Full-screen centered text on dark background
- Fade in animation on mount

---

### Step 24 — MilestoneScene (Celebration)
**File:** `frontend/components/celebrations/MilestoneScene.tsx`
**Depends on:** Step 19
- Triggered by `live:milestone` event or manual director push
- Full-screen celebration: large goal amount reached, confetti particle animation
- Hold for configured duration then return to previous scene
- Confetti: CSS or canvas-based, no heavy library required

---

### Step 25 — Admin Dashboard Shell
**File:** `frontend/app/admin/dashboard/page.tsx`
**Depends on:** Steps 16 and 18
- On mount check localStorage for access_token, redirect to `/admin` if missing
- Connect socket as admin via `connectAdmin(token)`
- Status cards: current layout template, connected display count, sync job count
- Director controls section:
  - Layout template picker (FULL_SCREEN, FULL_SCREEN_BAR, THREE_COLUMN, THREE_COLUMN_BAR, MAIN_SIDEBAR, MAIN_SIDEBAR_BAR)
  - Slot builder: for each slot in the chosen template, assign a pinned scene or configure a rotating set of scenes
  - Progress bar config (for `_BAR` templates): type selector (PERIOD_TOTAL or DONATION_COUNT), goal amount, start time, end time
  - Auto-cycle toggle + interval input (controls rotating slot cycle speed)
  - Freeze toggle, standby button
  - Override buttons: push MILESTONE or ANNOUNCEMENT full-screen, clear override to return to layout
- Wire controls to `PATCH /api/display/state`, `POST /api/display/override`, `DELETE /api/display/override`
- Listen for display status updates over socket and update connected count in real time

---

## Milestone 3 — Sync Engine

### Step 26 — Google Sheets Service
**File:** `backend/src/sync/sheets.service.ts`
**Depends on:** Step 1
- Install `googleapis` package
- `authenticateServiceAccount()` — use GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY from env
- `getSheetMeta(sheetUrl)` — return available tabs for the preview UI
- `upsertRows(sheetUrl, tabName, headers, rows, keyColumn)` — read existing sheet, diff against new rows, only append/update changed rows, never duplicate
- Handle Google API quota errors by throwing a typed error the worker can retry on

---

### Step 27 — Sync Worker
**File:** `backend/src/sync/sync.worker.ts`
**Depends on:** Steps 11 and 26
- Create a BullMQ Worker that processes the "sync" queue
- Job payload: `{ syncJobId }`
- On process:
  1. Load SyncJob + SyncFieldMapping + SyncCheckpoint from DB
  2. Fetch export data from DonorDrive client using the job's data type
  3. Apply field mappings (sourceField → targetColumn) and any transform rules
  4. Call `upsertRows` on Google Sheets
  5. Update SyncCheckpoint watermark
  6. Write SyncRun record (status, processedCount, finishedAt)
  7. Update SyncJob.lastRunAt and nextRunAt
- On failure: write SyncRun with FAILED status and error summary, do not throw (BullMQ will retry)
- Retry config: 3 attempts, exponential backoff starting at 5 seconds

---

### Step 28 — Sync Scheduler
**File:** `backend/src/sync/sync.scheduler.ts`
**Depends on:** Step 27
- On startup: load all SyncJobs with status ACTIVE from DB and schedule a repeatable BullMQ job for each
- `scheduleJob(syncJob)` — add a repeatable job to the "sync" queue with the job's intervalSec
- `unscheduleJob(syncJobId)` — remove the repeatable job from the queue
- `rescheduleJob(syncJob)` — unschedule then reschedule (used when interval changes)
- Export `startScheduler()` to be called from `index.ts`

---

### Step 29 — Sync Router
**File:** `backend/src/sync/sync.router.ts`
**Depends on:** Steps 4, 27, and 28
- All routes require `requireAuth`
- `GET /sync/jobs` — list all SyncJobs with last run status
- `POST /sync/jobs` — create SyncJob + SyncFieldMappings, schedule job, write AuditLog
- `PATCH /sync/jobs/:id` — update label, sheetUrl, tabName, intervalSec, reschedule if interval changed, write AuditLog
- `DELETE /sync/jobs/:id` — unschedule and delete, write AuditLog
- `POST /sync/jobs/:id/trigger` — add a one-time job to the queue immediately, return 202
- `POST /sync/jobs/:id/pause` — set status PAUSED, unschedule, write AuditLog
- `POST /sync/jobs/:id/resume` — set status ACTIVE, reschedule, write AuditLog
- `GET /sync/jobs/:id/runs` — return recent SyncRun history for a job
- `GET /sync/jobs/:id/preview` — dry run: fetch data and apply mappings but do not write to sheet

---

### Step 30 — Sync Admin UI
**File:** `frontend/app/admin/dashboard/page.tsx` (extend existing)
**Depends on:** Step 29
- Sync jobs section: list of jobs with name, status badge, last run time, next run time
- Add job form: sheet URL, tab name, data type dropdown, interval selector, field mapping builder
- Per-job actions: trigger now, pause/resume, delete
- Run history drawer: last 10 SyncRun records with status and processed count

---

### Step 31 — Reconciliation Report
**File:** `backend/src/sync/reconciliation.ts` (new file)
**Depends on:** Steps 11 and 26
- `generateReconciliationReport(syncJobId)` — compare DonorDrive source totals to what is in the Google Sheet
- Return: sourceTotal, sheetTotal, discrepancy, lastChecked
- Wire to `GET /sync/jobs/:id/reconcile` in the sync router

---

## Milestone 4 — Ops and Polish

### Step 32 — Audit Log Service
**File:** `backend/src/monitoring/audit.ts`
**Depends on:** Step 2
- `logAudit(actorId, action, entityType?, entityId?, metadata?)` — write to AuditLog table
- Replace all inline `prisma.auditLog.create` calls added throughout the codebase with this helper

---

### Step 33 — Metrics Service
**File:** `backend/src/monitoring/metrics.ts`
**Depends on:** Step 2
- `recordMetric(name, value, unit?)` — write to PerformanceMetric table
- Pre-built helpers:
  - `recordCommandDeliveryLatency(ms)` — call from display hub after pushScene
  - `recordDataFreshness(ms)` — call from poller with time between donation timestamp and broadcast
  - `recordSyncLatency(ms)` — call from sync worker

---

### Step 34 — Monitoring Dashboard UI
**File:** `frontend/app/admin/dashboard/page.tsx` (extend existing)
**Depends on:** Steps 32 and 33
- Token bucket card: current tokens, queued requests, refill rate
- Command delivery latency card: average over last hour
- Data freshness card: average over last hour
- Sync success rate card: successful runs / total runs over last 24 hours
- Audit log table: paginated, most recent first, searchable by action

---

### Step 35 — Passcode Management UI
**File:** `frontend/app/admin/dashboard/page.tsx` (extend existing)
**Depends on:** Step 5
- List active passcodes with label and expiry
- Create new passcode: label, optional expiry date
- Deactivate passcode button
- Wire to new endpoints: `GET /api/auth/passcodes`, `POST /api/auth/passcodes`, `DELETE /api/auth/passcodes/:id`
- Add those three endpoints to `auth.router.ts`

---

### Step 36 — CI Pipeline
**File:** `.github/workflows/ci.yml`
**Depends on:** everything above
- Replace placeholder CI with real steps:
  - Checkout
  - Setup Node 20
  - Install backend dependencies
  - Install frontend dependencies
  - Run `prisma generate` on backend
  - Run TypeScript type check on backend (`tsc --noEmit`)
  - Run TypeScript type check on frontend (`next build` or `tsc --noEmit`)
  - Run backend tests
  - Run frontend lint

---

## Milestone 5 — Post-Event

### Step 37 — Performance Targets Verification
After the event, pull PerformanceMetric rows from the database and confirm:
- Average director command delivery < 3000ms
- Average data freshness < 5000ms
- Sync job success rate >= 99%
- Zero unrecovered display crashes during event window

### Step 38 — Post-Event Retrospective
Write `RETROSPECTIVE.md` at the project root covering:
- What was built and how it performed
- Exact failures that occurred (with timestamps and what the fix was)
- Measured performance numbers from Step 37
- What would be done differently

### Step 39 — Demo Video + README
- Record a 3-5 minute walkthrough: login, director control, live display, sync config
- Update `README.md` with architecture diagram, setup instructions, and link to video
- This is what you send to recruiters
