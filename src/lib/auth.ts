import { db } from '$lib';
import { session, user } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as crypto from 'node:crypto';
import { redirect } from '@sveltejs/kit';
import { decryptEmail } from '$lib/encryption';

const ITERATIONS = 310000;
const KEYLEN = 32;
const DIGEST = 'sha256';

export function hashPassword(password: string) {
	const salt = crypto.randomBytes(16).toString('hex');
	const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
	const algo = `pbkdf2-sha256$${ITERATIONS}`;
	return { salt, hash, algo };
}

export function validatePassword(inputPassword: string, salt: string, storedHash: string) {
	const hash = crypto.pbkdf2Sync(inputPassword, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
	const a = Buffer.from(storedHash, 'hex');
	const b = Buffer.from(hash, 'hex');
	if (a.length !== b.length) return false;
	return crypto.timingSafeEqual(a, b);
}

export function dummyHash() {
	crypto.pbkdf2Sync('dummy-password', 'dummy-salt', ITERATIONS, KEYLEN, DIGEST).toString('hex');
}

export function generateSessionToken() {
	return crypto.randomBytes(32).toString('hex');
}

export async function createSession(userId: string, userAgent?: string, ipAddress?: string) {
	const token = generateSessionToken();
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + 14);

	const [s] = await db
		.insert(session)
		.values({ token, userId, userAgent, ipAddress, expiresAt })
		.returning();

	return s;
}

export function isTokenExpired(createdAt: Date, maxAgeInDays: number = 7): boolean {
	const now = new Date();
	const maxAgeInMillis = maxAgeInDays * 24 * 60 * 60 * 1000;
	return now.getTime() - createdAt.getTime() > maxAgeInMillis;
}

export async function requireAuth(cookies: any) {
	const sessionToken = cookies.get('sessionToken');

	if (!sessionToken) {
		throw redirect(307, '/login');
	}

	const s = await db.query.session.findFirst({
		where: eq(session.token, sessionToken),
		with: { user: true }
	});

	if (!s || !s.user) {
		cookies.delete('sessionToken', { path: '/' });
		throw redirect(307, '/login');
	}

	const expiredDays = 7;
	if (isTokenExpired(s.createdAt, expiredDays)) {
		await db.delete(session).where(eq(session.id, s.id));

		cookies.delete('sessionToken', { path: '/' });
		throw redirect(307, '/login');
	}

	if (s.user.email) {
		s.user.email = decryptEmail(s.user.email);
	}

	return s.user;
}

export async function validateSession(token: string) {
	const s = await db.query.session.findFirst({
		where: eq(session.token, token),
		with: { user: true }
	});

	if (!s) {
		return null;
	}

	if (s.expiresAt < new Date()) {
		await db.delete(session).where(eq(session.id, s.id));
		return null;
	}

	await db
		.update(session)
		.set({ lastUsed: new Date() })
		.where(eq(session.id, s.id));

	if (s.user?.email) {
		s.user.email = decryptEmail(s.user.email);
	}

	return s;
}
