import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
    // @ts-ignore - directUrl is required by Prisma v7 but missing from types in current release
    directUrl: process.env.DIRECT_URL,
  },
});
