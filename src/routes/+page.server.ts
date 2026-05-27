import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { prisma } from '$lib';
import { createSession, dummyHash, hashPassword, validatePassword, validateSession } from '$lib/auth';

const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

function normalize(value: FormDataEntryValue | null) {
	return typeof value === 'string' ? value.trim() : '';
}

export async function load(event) {
	const sessionToken = event.cookies.get('sessionToken');
	
	if (!sessionToken) {
		return { user: null };
	}

	const session = await validateSession(sessionToken);
	
	if (!session || !session.user) {
		event.cookies.delete('sessionToken', { path: '/' });
		return { user: null };
	}

	return { user: session.user };
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

		const existingUser = await prisma.user.findFirst({
			where: {
				OR: [{ username }, ...(email ? [{ email }] : [])]
			}
		});

		if (existingUser) {
			return fail(400, {
				registerError: 'That username or email is already in use.',
				activeTab: 'register'
			});
		}

		const passwordData = hashPassword(password);
		const user = await prisma.user.create({
			data: {
				username,
				email,
				passwordHash: passwordData.hash,
				passwordSalt: passwordData.salt,
				passwordAlgo: passwordData.algo,
				lastActive: new Date()
			}
		});

		const session = await createSession(
			user.id,
			event.request.headers.get('user-agent') ?? undefined,
			event.getClientAddress()
		);

		event.cookies.set('sessionToken', session.token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: event.url.protocol === 'https:',
			maxAge: SESSION_MAX_AGE
		});

		return {
			success: true,
			user: {
				id: user.id,
				username: user.username,
				email: user.email
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

		const user = await prisma.user.findFirst({
			where: {
				OR: [{ username: identifierInput }, { email: identifier }]
			}
		});

		if (!user?.passwordHash || !user.passwordSalt) {
			dummyHash();
			return fail(400, {
				loginError: 'Invalid credentials.',
				activeTab: 'login'
			});
		}

		const isValid = validatePassword(password, user.passwordSalt, user.passwordHash);
		if (!isValid) {
			return fail(400, {
				loginError: 'Invalid credentials.',
				activeTab: 'login'
			});
		}

		const session = await createSession(
			user.id,
			event.request.headers.get('user-agent') ?? undefined,
			event.getClientAddress()
		);

		event.cookies.set('sessionToken', session.token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: event.url.protocol === 'https:',
			maxAge: SESSION_MAX_AGE
		});

		await prisma.user.update({
			where: { id: user.id },
			data: { lastActive: new Date() }
		});

		return {
			success: true,
			user: {
				id: user.id,
				username: user.username,
				email: user.email
			}
		};
	},

	logout: async (event) => {
		const sessionToken = event.cookies.get('sessionToken');
		
		if (sessionToken) {
			await prisma.session.deleteMany({
				where: { token: sessionToken }
			});
		}
		
		event.cookies.delete('sessionToken', { path: '/' });
		throw redirect(303, '/');
	},

	claimDaily: async (event) => {
		const sessionToken = event.cookies.get('sessionToken');
		
		if (!sessionToken) {
			return fail(401, { claimError: 'You must be signed in to claim daily coins.' });
		}

		const session = await validateSession(sessionToken);
		
		if (!session || !session.user) {
			event.cookies.delete('sessionToken', { path: '/' });
			return fail(401, { claimError: 'Invalid session.' });
		}

		const user = session.user;
		const now = new Date();
		const lastClaimed = user.lastClaimed;

		// Check if 24 hours have passed (86,400,000 ms)
		if (lastClaimed && (now.getTime() - new Date(lastClaimed).getTime() < 24 * 60 * 60 * 1000)) {
			const msRemaining = 24 * 60 * 60 * 1000 - (now.getTime() - new Date(lastClaimed).getTime());
			const hours = Math.floor(msRemaining / (1000 * 60 * 60));
			const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
			return fail(400, {
				claimError: `Next claim available in ${hours}h ${minutes}m.`
			});
		}

		await prisma.user.update({
			where: { id: user.id },
			data: {
				coins: { increment: 250 },
				lastClaimed: now
			}
		});

		return { claimSuccess: true };
	}
};
