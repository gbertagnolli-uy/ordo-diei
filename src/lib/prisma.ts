import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error("DATABASE_URL is not defined in environment variables");
  }

  // Supabase Pooler needs SSL rejectUnauthorized: false when connecting
  // via postgresql://postgres.[project]:[password]@aws-0-sa-east-1.pooler.supabase.com:6543
  const isSupabase = connectionString?.includes('supabase.com') || connectionString?.includes('pooler.supabase.com');

  const pool = new Pool({
    connectionString,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined
  });

  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
