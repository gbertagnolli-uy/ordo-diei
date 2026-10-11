import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres"
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not defined in environment variables");
    return new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString })) });
  }

  // Supabase Pooler needs SSL rejectUnauthorized: false when connecting
  const isSupabase = connectionString?.includes('supabase.com') || connectionString?.includes('pooler.supabase.com') || connectionString?.includes('supabase.co');

  const pool = new Pool({
    connectionString,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined
  });

  // Tables live in a dedicated Postgres schema (e.g. ?schema=family_tasker), not in public
  const schema = new URL(connectionString).searchParams.get('schema') ?? undefined

  const adapter = new PrismaPg(pool, { schema })
  return new PrismaClient({ adapter })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
