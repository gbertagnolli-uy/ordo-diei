import 'dotenv/config'
import { defineConfig } from '@prisma/config'

export default defineConfig({
  datasource: {
    // CLI (db push / migrate) uses the session pooler; runtime uses DATABASE_URL via the pg adapter
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
})
