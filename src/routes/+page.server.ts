import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib';
import { user, session } from '../db/schema';
import { eq, or, sql } from 'drizzle-orm';
import { createSession, dummyHash, hashPassword, validatePassword, validateSession } from '$lib/auth';
import { encryptEmail, decryptEmail, hashEmail } from '$lib/encryption';

const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

function normalize(value: FormDataEntryValue | null) {
	return typeof value === 'string' ? value.trim() : '';
}

export async function load(event) {
	const sessionToken = event.cookies.get('sessionToken');

	if (!sessionToken) {
		return { user: null };
	}

	const s = await validateSession(sessionToken);

	if (!s || !s.user) {
		event.cookies.delete('sessionToken', { path: '/' });
		return { user: null };
	}

	return { user: s.user };
}

export const actions: Actions = {
	register: async (event) => {
		const formData = await event.request.formData();
		const username = normalize(formData.get('username'));
		const emailInput = normalize(formData.get('email'));
		const email = emailInput.length ? emailInput.toLowerCase() : null;
		const password = normalize(formData.get('password'));

		if (!username || !password) {
			return fail(400, {
				registerError: 'Username and password are required.',
				activeTab: 'register'
			});
		}

		if (username.length < 3) {
			return fail(400, {
				registerError: 'Username must be at least 3 characters.',
				activeTab: 'register'
			});
		}

		if (password.length < 8) {
			return fail(400, {
				registerError: 'Password must be at least 8 characters.',
				activeTab: 'register'
			});
		}

		const existingUser = await db
			.select()
			.from(user)
			.where(
				or(
					eq(user.username, username),
					...(email ? [eq(user.emailHash, hashEmail(email))] : [])
				)
			)
			.limit(1);

		if (existingUser.length > 0) {
			return fail(400, {
				registerError: 'That username or email is already in use.',
				activeTab: 'register'
			});
		}

		const passwordData = hashPassword(password);
		const [newUser] = await db
			.insert(user)
			.values({
				username,
				email: email ? encryptEmail(email) : null,
				emailHash: email ? hashEmail(email) : null,
				passwordHash: passwordData.hash,
				passwordSalt: passwordData.salt,
				passwordAlgo: passwordData.algo,
				lastActive: new Date()
			})
			.returning();

		const sessionRecord = await createSession(
			newUser.id,
			event.request.headers.get('user-agent') ?? undefined,
			event.getClientAddress()
		);

		event.cookies.set('sessionToken', sessionRecord.token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: event.url.protocol === 'https:',
			maxAge: SESSION_MAX_AGE
		});

		return {
			success: true,
			user: {
				id: newUser.id,
				username: newUser.username,
				email: email
			}
		};
	},

	login: async (event) => {
		const formData = await event.request.formData();
		const identifierInput = normalize(formData.get('identifier'));
		const identifier = identifierInput.toLowerCase();
		const password = normalize(formData.get('password'));

		if (!identifierInput || !password) {
			return fail(400, {
				loginError: 'Username/email and password are required.',
				activeTab: 'login'
			});
		}

		const [foundUser] = await db
			.select()
			.from(user)
			.where(
				or(
					eq(user.username, identifierInput),
					eq(user.emailHash, hashEmail(identifier))
				)
			)
			.limit(1);

		if (!foundUser?.passwordHash || !foundUser.passwordSalt) {
			dummyHash();
			return fail(400, {
				loginError: 'Invalid credentials.',
				activeTab: 'login'
			});
		}

		const isValid = validatePassword(password, foundUser.passwordSalt, foundUser.passwordHash);
		if (!isValid) {
			return fail(400, {
				loginError: 'Invalid credentials.',
				activeTab: 'login'
			});
		}

		const sessionRecord = await createSession(
			foundUser.id,
			event.request.headers.get('user-agent') ?? undefined,
			event.getClientAddress()
		);

		event.cookies.set('sessionToken', sessionRecord.token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: event.url.protocol === 'https:',
			maxAge: SESSION_MAX_AGE
		});

		await db
			.update(user)
			.set({ lastActive: new Date() })
			.where(eq(user.id, foundUser.id));

		const decryptedEmail = foundUser.email ? decryptEmail(foundUser.email) : null;

		return {
			success: true,
			user: {
				id: foundUser.id,
				username: foundUser.username,
				email: decryptedEmail
			}
		};
	},

	logout: async (event) => {
		const sessionToken = event.cookies.get('sessionToken');

		if (sessionToken) {
			await db.delete(session).where(eq(session.token, sessionToken));
		}

		event.cookies.delete('sessionToken', { path: '/' });
		throw redirect(303, '/');
	},

	claimDaily: async (event) => {
		const sessionToken = event.cookies.get('sessionToken');

		if (!sessionToken) {
			return fail(401, { claimError: 'You must be signed in to claim daily coins.' });
		}

		const s = await validateSession(sessionToken);

		if (!s || !s.user) {
			event.cookies.delete('sessionToken', { path: '/' });
			return fail(401, { claimError: 'Invalid session.' });
		}

		const foundUser = s.user;
		const now = new Date();
		const lastClaimed = foundUser.lastClaimed;

		if (lastClaimed && (now.getTime() - new Date(lastClaimed).getTime() < 24 * 60 * 60 * 1000)) {
			const msRemaining = 24 * 60 * 60 * 1000 - (now.getTime() - new Date(lastClaimed).getTime());
			const hours = Math.floor(msRemaining / (1000 * 60 * 60));
			const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
			return fail(400, {
				claimError: `Next claim available in ${hours}h ${minutes}m.`
			});
		}

		await db
			.update(user)
			.set({
				coins: sql`${user.coins} + 250`,
				lastClaimed: now
			})
			.where(eq(user.id, foundUser.id));

		return { claimSuccess: true };
	}
};
