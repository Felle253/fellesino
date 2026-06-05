import * as crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_ITERATIONS = 100000;
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

let _key: Buffer | null = null;

function getKey(): Buffer {
	if (_key) return _key;
	const passphrase = process.env.ENCRYPTION_KEY;
	if (!passphrase) throw new Error('ENCRYPTION_KEY environment variable is not set');
	_key = crypto.pbkdf2Sync(passphrase, 'fellesino-encryption-v1', KEY_ITERATIONS, KEY_LENGTH, 'sha256');
	return _key;
}

export function encryptEmail(email: string): string {
	const key = getKey();
	const iv = crypto.randomBytes(IV_LENGTH);
	const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
	let encrypted = cipher.update(email.toLowerCase(), 'utf8', 'hex');
	encrypted += cipher.final('hex');
	const authTag = cipher.getAuthTag().toString('hex');
	return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptEmail(encryptedText: string): string {
	const key = getKey();
	const [ivHex, authTagHex, data] = encryptedText.split(':');
	const iv = Buffer.from(ivHex, 'hex');
	const authTag = Buffer.from(authTagHex, 'hex');
	const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
	decipher.setAuthTag(authTag);
	let decrypted = decipher.update(data, 'hex', 'utf8');
	decrypted += decipher.final('utf8');
	return decrypted;
}

export function hashEmail(email: string): string {
	const key = getKey();
	return crypto.createHmac('sha256', key).update(email.toLowerCase()).digest('hex');
}
