# DonorDrive Live Display Platform

A real-time event display platform for CMN Dance Marathon fundraising events. An admin controls what appears on a projected display — live donations, leaderboards, milestones, and announcements — all updated in real time via WebSocket.

## Demo

https://github.com/user-attachments/assets/20260415-1637-20.3134871.mp4

## Architecture

```
┌──────────────┐    WebSocket / REST    ┌──────────────┐    HTTP    ┌──────────────────┐
│   Frontend   │ ◄────────────────────► │   Backend    │ ◄────────►│  DonorDrive API  │
│  (Next.js)   │                        │  (Express)   │           │  or Mock Server  │
└──────────────┘                        └──────┬───────┘           └──────────────────┘
                                               │
                                          PostgreSQL
                                        (Auth + Config)
```

**Frontend** — Next.js, React, Tailwind CSS, Framer Motion, Socket.IO client
**Backend** — Express, Socket.IO, Prisma, Argon2, JWT
**Database** — PostgreSQL (users, passcodes, display state)

## Features

- **Director Control Panel** — Admin dashboard to push layouts, scenes, and overrides to all connected displays in real time
- **Live Display** — Passcode-gated kiosk view designed for projectors (1080p/4K), with animated scene transitions
- **Scene Types** — Standby, Donations ticker, Team Leaderboard, Participant Leaderboard, Milestone celebration, Announcement, Total raised
- **Layout Templates** — Full screen, three-column, main + sidebar, each with optional progress bar
- **Rank Diff Engine** — Server-side leaderboard position tracking with animated rank changes on the display
- **Reconnect Resilience** — WebSocket replay buffer ensures displays recover state after network drops
- **Token Bucket Rate Limiter** — Protects against DonorDrive API quota exhaustion
- **Demo Mode** — Built-in mock server with fake campaigns, teams, and auto-generating donations

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)

### Setup

```bash
# Start PostgreSQL
docker compose up -d

# Install dependencies
npm install --prefix backend
npm install --prefix frontend

# Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
# Edit backend/.env — generate JWT secrets with:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Create database tables and seed
cd backend
npx prisma generate
npx prisma migrate dev --name init
npm run seed
cd ..

# Run everything (backend + frontend + mock server)
npm run dev
```

### Access

| URL | Purpose | Credentials |
|-----|---------|-------------|
| http://localhost:3000 | Passcode gate → Display | `12345` |
| http://localhost:3000/admin | Admin login → Dashboard | `admin@example.com` / password from .env |
| http://localhost:4001/status | Mock server status | — |

### Reset to Fresh Demo

```bash
cd backend
npx prisma db push --force-reset
npm run seed
```

Then restart the mock server to reset donation data.

## Project Structure

```
donordriveproject/
├── backend/
│   ├── src/
│   │   ├── auth/           # Login, JWT, passcode verification
│   │   ├── display/        # WebSocket hub, director commands, polling, rank diff
│   │   ├── donordrive/     # API client, token bucket rate limiter
│   │   ├── monitoring/     # Logger (Winston)
│   │   └── db/             # Prisma client
│   ├── mock/               # Mock DonorDrive server + seed data
│   ├── scripts/            # Database seed script
│   └── prisma/             # Schema + migrations
├── frontend/
│   ├── app/
│   │   ├── display/        # Kiosk display page
│   │   ├── admin/          # Login + dashboard
│   │   └── gate/           # Passcode entry
│   ├── components/
│   │   ├── scenes/         # Individual display scenes
│   │   ├── leaderboard/    # Rank diff animated rows
│   │   ├── celebrations/   # Milestone animation
│   │   └── admin/          # Admin console UI
│   └── lib/                # Socket client, auth helpers, API utilities
└── docker-compose.yml
```

## Environment Variables

See [`backend/.env.example`](backend/.env.example) and [`frontend/.env.local.example`](frontend/.env.local.example) for all configuration options.

## License

MIT
