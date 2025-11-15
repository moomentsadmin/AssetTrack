// Smart database connection that works for both Replit (Neon) and self-hosted PostgreSQL
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import ws from 'ws';
import * as schema from "@shared/schema";

// Lazy database connection initialization
// This allows the app to start even if the database is temporarily unavailable
let pool: any;
let db: any;
let initialized = false;

function initializeDatabase() {
  if (initialized) return;
  
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  const databaseUrl = process.env.DATABASE_URL;

  // Detect if using Neon database or standard PostgreSQL
  // Priority: 1) Explicit override (DATABASE_DRIVER), 2) URL pattern matching
  const driverOverride = process.env.DATABASE_DRIVER?.toLowerCase();

  let isNeonDatabase: boolean;
  if (driverOverride === 'neon') {
    isNeonDatabase = true;
  } else if (driverOverride === 'pg' || driverOverride === 'postgres') {
    isNeonDatabase = false;
  } else if (driverOverride && driverOverride !== 'auto') {
    // Invalid value - warn and default to standard PostgreSQL
    isNeonDatabase = false;
  } else {
    // Auto-detect based on URL pattern
    isNeonDatabase = databaseUrl.includes('neon.tech') || databaseUrl.includes('neon.app');
  }

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
  
  initialized = true;
}

export { pool, db };

// Export a getter that ensures database is initialized
Object.defineProperty(module.exports, 'pool', {
  get: () => {
    initializeDatabase();
    return pool;
  }
});

Object.defineProperty(module.exports, 'db', {
  get: () => {
    initializeDatabase();
    return db;
  }
});
