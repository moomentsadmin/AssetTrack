// Reset Admin Password Script (uses scrypt-compatible hashing and direct PG connection)
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { Client } from 'pg';

const scryptAsync = promisify(scrypt);

const newPassword = process.argv[2];
const username = process.argv[3] || 'admin';

if (!newPassword) {
  console.error('❌ Error: Please provide a new password');
  console.log('Usage: node reset-admin-password.js <new-password> [username]');
  console.log('Example: node reset-admin-password.js MyNewPassword123! admin');
  process.exit(1);
}

async function makeScryptHash(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function resetPassword() {
  try {
    console.log(`🔐 Resetting password for user: ${username}`);

    const hashedPassword = await makeScryptHash(newPassword);

    // Use DATABASE_URL or individual PG_* env vars
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    const res = await client.query(
      'UPDATE users SET password=$1 WHERE username=$2 RETURNING id, username, email',
      [hashedPassword, username],
    );

    if (res.rowCount === 0) {
      console.error(`❌ User "${username}" not found`);
      const list = await client.query('SELECT username, role FROM users');
      console.log('\nAvailable users:');
      list.rows.forEach(u => console.log(`  - ${u.username} (${u.role})`));
      await client.end();
      process.exit(1);
    }

    console.log(`✅ Password reset successfully for: ${res.rows[0].username}`);
    console.log(`\nYou can now login at: http://localhost:5000/auth`);
    console.log(`Username: ${res.rows[0].username}`);
    console.log(`Password: ${newPassword}`);

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  }
}

resetPassword();
