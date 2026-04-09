# Payments

> **Navigation aid.** Route list and file locations extracted via AST. Read the source files listed below before implementing or modifying this subsystem.

The Payments subsystem handles **1 routes** and touches: auth, payment.

## Routes

- `POST` `/api/v1/subscriptions/webhook` → out: { message, statusCode, timestamp } [auth, payment]
  `web/src/app/api/v1/subscriptions/webhook/route.ts`

## Source Files

Read these before implementing or modifying this subsystem:
- `web/src/app/api/v1/subscriptions/webhook/route.ts`

---
_Back to [overview.md](./overview.md)_