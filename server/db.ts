// Smart database connection that works for both Replit (Neon) and self-hosted PostgreSQL
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import ws from 'ws';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const databaseUrl = process.env.DATABASE_URL;

// Detect if using Neon (Replit's managed database) or standard PostgreSQL
const isNeonDatabase = databaseUrl.includes('neon.tech') || 
                       databaseUrl.includes('neon.app') ||
                       process.env.REPL_ID !== undefined; // Replit environment

let pool: any;
let db: any;

if (isNeonDatabase) {
  // Use Neon serverless driver for Replit's managed database
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: databaseUrl });
  db = neonDrizzle({ client: pool, schema });
} else {
  // Use standard PostgreSQL driver for self-hosted databases (Ubuntu, Docker, etc.)
  pool = new PgPool({ 
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false
  });
  db = pgDrizzle(pool, { schema });
}

export { pool, db };
