const { scrypt, randomBytes } = require('crypto');
const { promisify } = require('util');
const scryptAsync = promisify(scrypt);
const password = process.argv[2];
if (!password) {
  console.error('Usage: node gen-scrypt.cjs <password>');
  process.exit(1);
}
(async () => {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  console.log(`${buf.toString('hex')}.${salt}`);
})();
