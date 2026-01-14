const { scryptSync, randomBytes } = require('crypto');
const pass = process.argv[2];
if (!pass) { console.error('Usage: node gen_hash.cjs <password>'); process.exit(1); }
const salt = randomBytes(16).toString('hex');
const buf = scryptSync(pass, salt, 64);
console.log(buf.toString('hex') + '.' + salt);
