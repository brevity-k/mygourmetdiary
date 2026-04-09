# Routes

- `POST` `/api/v1/auth/register` [auth, db]
- `GET` `/api/v1/health` [db]
- `POST` `/api/v1/subscriptions/webhook` → out: { message, statusCode, timestamp } [auth, payment]
