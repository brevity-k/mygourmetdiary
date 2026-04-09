# mygourmetdiary — Overview

> **Navigation aid.** This article shows WHERE things live (routes, models, files). Read actual source files before implementing new features or making changes.

**mygourmetdiary** is a typescript project built with next-app, using prisma for data persistence, organized as a monorepo.

**Workspaces:** `mobile` (`mobile`), `web` (`web`), `@mygourmetdiary/shared-api` (`packages/shared-api`), `@mygourmetdiary/shared-constants` (`packages/shared-constants`), `@mygourmetdiary/shared-types` (`packages/shared-types`)

## Scale

3 API routes · 20 database models · 103 UI components · 4 middleware layers · 39 environment variables

## Subsystems

- **[Auth](./auth.md)** — 1 routes — touches: auth, db
- **[Payments](./payments.md)** — 1 routes — touches: auth, payment
- **[Route](./route.md)** — 1 routes — touches: db

**Database:** prisma, 20 models — see [database.md](./database.md)

**UI:** 103 components (react) — see [ui.md](./ui.md)

## High-Impact Files

Changes to these files have the widest blast radius across the codebase:

- `mobile/src/theme/index.ts` — imported by **63** files
- `mobile/src/types/index.ts` — imported by **32** files
- `mobile/src/api/endpoints.ts` — imported by **28** files
- `mobile/src/navigation/types.ts` — imported by **24** files
- `web/src/lib/api/clients/prisma.ts` — imported by **20** files
- `backend/prisma/generated/client/enums.ts` — imported by **19** files

## Required Environment Variables

- `CRON_SECRET` — `web/src/lib/api/middleware.ts`
- `EXPO_PUBLIC_REVENUECAT_API_KEY` — `mobile/src/services/purchases.ts`
- `REVENUECAT_WEBHOOK_AUTH_KEY` — `web/src/app/api/v1/subscriptions/webhook/route.ts`

---
_Back to [index.md](./index.md) · Generated 2026-04-09_