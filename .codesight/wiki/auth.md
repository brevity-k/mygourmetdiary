# Auth

> **Navigation aid.** Route list and file locations extracted via AST. Read the source files listed below before implementing or modifying this subsystem.

The Auth subsystem handles **1 routes** and touches: auth, db.

## Routes

- `POST` `/api/v1/auth/register` [auth, db]
  `web/src/app/api/v1/auth/register/route.ts`

## Middleware

- **auth.store** (auth) — `mobile/src/store/auth.store.ts`
- **middleware** (auth) — `web/src/lib/api/middleware.ts`
- **auth-context** (auth) — `web/src/lib/auth-context.tsx`
- **middleware** (auth) — `web/src/lib/supabase/middleware.ts`

## Source Files

Read these before implementing or modifying this subsystem:
- `web/src/app/api/v1/auth/register/route.ts`

---
_Back to [overview.md](./overview.md)_