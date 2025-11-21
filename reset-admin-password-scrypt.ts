// Reset Admin Password Script (scrypt-based to match auth.ts)
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { db } from './server/db';
import { users } from './shared/schema';
import { eq } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function main() {
  const newPassword = process.argv[2];
  const username = process.argv[3] || 'admin';

  if (!newPassword) {
    console.error('Error: Please provide a new password');
    console.log('Usage: npx tsx reset-admin-password-scrypt.ts <new-password> [username]');
    process.exit(1);
  }

  try {
    console.log(`Resetting password for user: ${username}`);
    const hashed = await hashPassword(newPassword);

    const result = await db
      .update(users)
      .set({ password: hashed })
      .where(eq(users.username, username))
      .returning({ id: users.id, username: users.username });

    if (result.length === 0) {
      console.error(`User "${username}" not found`);
      console.log('\nAvailable users:');
      const allUsers = await db.select({ username: users.username, role: users.role }).from(users);
      allUsers.forEach((u) => console.log(`  - ${u.username} (${u.role})`));
      process.exit(1);
    }

    console.log(`Password reset successfully for: ${result[0].username}`);
    console.log(`You can now login at: http://localhost:5000/api/login`);
    console.log(`Username: ${result[0].username}`);
    console.log(`Password: ${newPassword}`);
  } catch (error: any) {
    console.error('Error resetting password:', error?.message || error);
    process.exit(1);
  }
}

main();