// Reset Admin Password Script
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

const newPassword = process.argv[2];
const username = process.argv[3] || 'admin';

if (!newPassword) {
  console.error('❌ Error: Please provide a new password');
  console.log('Usage: node reset-admin-password.js <new-password> [username]');
  console.log('Example: node reset-admin-password.js MyNewPassword123! admin');
  process.exit(1);
}

async function resetPassword() {
  try {
    console.log(`🔐 Resetting password for user: ${username}`);
    
    // Hash the new password with scrypt (same as app)
    const salt = randomBytes(16).toString('hex');
    const scryptAsync = promisify(scrypt);
    const buf = await scryptAsync(newPassword, salt, 64);
    const hashedPassword = `${buf.toString('hex')}.${salt}`;
    
    // Update the password
    const result = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, username))
      .returning({ id: users.id, username: users.username });
    
    if (result.length === 0) {
      console.error(`❌ User "${username}" not found`);
      console.log('\nCreating admin user...');
      const [created] = await db
        .insert(users)
        .values({
          username,
          fullName: 'Admin User',
          email: `${username}@example.com`,
          role: 'admin',
          department: null,
          isContractor: false,
          password: hashedPassword,
        })
        .returning({ id: users.id, username: users.username });
      console.log(`✅ Created admin user: ${created.username}`);
      process.exit(0);
    }
    
    console.log(`✅ Password reset successfully for: ${result[0].username}`);
    console.log(`\nYou can now login at: http://test.digile.com:5000/auth`);
    console.log(`Username: ${result[0].username}`);
    console.log(`Password: ${newPassword}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  }
}

resetPassword();
