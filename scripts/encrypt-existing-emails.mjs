import pg from 'pg';
import * as crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_ITERATIONS = 100000;
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

const passphrase = process.env.ENCRYPTION_KEY;
if (!passphrase) {
	console.error('ENCRYPTION_KEY environment variable is not set');
	process.exit(1);
}

const key = crypto.pbkdf2Sync(passphrase, 'fellesino-encryption-v1', KEY_ITERATIONS, KEY_LENGTH, 'sha256');

function encryptEmail(email) {
	const iv = crypto.randomBytes(IV_LENGTH);
	const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
	let encrypted = cipher.update(email.toLowerCase(), 'utf8', 'hex');
	encrypted += cipher.final('hex');
	const authTag = cipher.getAuthTag().toString('hex');
	return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function hashEmail(email) {
	return crypto.createHmac('sha256', key).update(email.toLowerCase()).digest('hex');
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
	const { rows } = await pool.query('SELECT id, email FROM "User" WHERE email IS NOT NULL AND "emailHash" IS NULL');
	console.log(`Found ${rows.length} users with unencrypted emails`);

	for (const row of rows) {
		const encrypted = encryptEmail(row.email);
		const hash = hashEmail(row.email);
		await pool.query('UPDATE "User" SET email = $1, "emailHash" = $2 WHERE id = $3', [encrypted, hash, row.id]);
		console.log(`  Updated user ${row.id}`);
	}

	console.log('Done!');
} catch (err) {
	console.error('Error:', err);
	process.exit(1);
} finally {
	await pool.end();
}
