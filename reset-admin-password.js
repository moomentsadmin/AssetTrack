// Reset Admin Password Script
import bcrypt from 'bcrypt';
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
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the password
    const result = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, username))
      .returning({ id: users.id, username: users.username });
    
    if (result.length === 0) {
      console.error(`❌ User "${username}" not found`);
      console.log('\nAvailable users:');
      const allUsers = await db.select({ username: users.username, role: users.role }).from(users);
      allUsers.forEach(u => console.log(`  - ${u.username} (${u.role})`));
      process.exit(1);
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
