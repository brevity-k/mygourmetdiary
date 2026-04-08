import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // Use SUPABASE_DB_URL_DIRECT for direct connections (migrations, introspection)
    // Falls back to placeholder so prisma generate works without env vars (CI lint/typecheck)
    url: process.env.SUPABASE_DB_URL_DIRECT ?? process.env.SUPABASE_DB_URL ?? 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
  },
  migrations: {
    path: 'prisma/migrations',
  },
});
