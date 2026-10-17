import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer loads env files itself; `vercel env pull` writes .env.local.
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL },
});
