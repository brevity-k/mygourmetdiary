# Config

## Environment Variables

- `ALLOWED_ORIGINS` (has default) — backend/.env
- `CRON_SECRET` **required** — web/src/lib/api/middleware.ts
- `DATABASE_URL` (has default) — backend/.env
- `EXPO_PUBLIC_API_URL` (has default) — mobile/.env.local
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (has default) — mobile/.env.local
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (has default) — mobile/.env.local
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (has default) — mobile/.env.local
- `EXPO_PUBLIC_REVENUECAT_API_KEY` **required** — mobile/src/services/purchases.ts
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` (has default) — mobile/.env.local
- `EXPO_PUBLIC_SUPABASE_URL` (has default) — mobile/.env.local
- `FIREBASE_CLIENT_EMAIL` (has default) — backend/.env
- `FIREBASE_PRIVATE_KEY` (has default) — backend/.env
- `FIREBASE_PROJECT_ID` (has default) — backend/.env
- `GOOGLE_PLACES_API_KEY` (has default) — backend/.env
- `MEILISEARCH_API_KEY` (has default) — backend/.env
- `MEILISEARCH_HOST` (has default) — backend/.env
- `NEXT_PUBLIC_API_URL` (has default) — web/.env.local
- `NEXT_PUBLIC_FIREBASE_API_KEY` (has default) — web/.env.local
- `NEXT_PUBLIC_FIREBASE_APP_ID` (has default) — web/.env.local
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` (has default) — web/.env.local
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` (has default) — web/.env.local
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (has default) — web/.env.local
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` (has default) — web/.env.local
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (has default) — web/.env.local
- `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` (has default) — web/.env.local
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (has default) — web/.env.local
- `NEXT_PUBLIC_SUPABASE_URL` (has default) — web/.env.local
- `NODE_ENV` (has default) — backend/.env
- `PORT` (has default) — backend/.env
- `R2_ACCESS_KEY_ID` (has default) — backend/.env
- `R2_ACCOUNT_ID` (has default) — backend/.env
- `R2_BUCKET_NAME` (has default) — backend/.env
- `R2_PUBLIC_URL` (has default) — backend/.env
- `R2_SECRET_ACCESS_KEY` (has default) — backend/.env
- `REDIS_URL` (has default) — web/.env.local
- `REVENUECAT_WEBHOOK_AUTH_KEY` **required** — web/src/app/api/v1/subscriptions/webhook/route.ts
- `SUPABASE_DB_URL` (has default) — web/.env.local
- `SUPABASE_DB_URL_DIRECT` (has default) — web/.env.local
- `SUPABASE_SERVICE_ROLE_KEY` (has default) — web/.env.local

## Config Files

- `mobile/.env.example`
- `web/next.config.ts`

## Key Dependencies

- next: 16.2.2
- react: 19.1.0
