import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib';
import { user } from '../../../db/schema';
import { or, eq } from 'drizzle-orm';
import { createSession, hashPassword, dummyHash } from '$lib/auth';
import { encryptEmail, hashEmail } from '$lib/encryption';

const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

export const POST: RequestHandler = async (event) => {
	const formData = await event.request.formData();
	const username = (formData.get('username') as string || '').trim();
	const emailInput = (formData.get('email') as string || '').trim();
	const email = emailInput ? emailInput.toLowerCase() : null;
	const password = (formData.get('password') as string || '').trim();

	if (!username || !password) {
		return json({ error: 'Username and password are required.', activeTab: 'register' }, { status: 400 });
	}

	if (username.length < 3) {
		return json({ error: 'Username must be at least 3 characters.', activeTab: 'register' }, { status: 400 });
	}

	if (password.length < 8) {
		return json({ error: 'Password must be at least 8 characters.', activeTab: 'register' }, { status: 400 });
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
		return json({ error: 'That username or email is already in use.', activeTab: 'register' }, { status: 400 });
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

	return json({
		success: true,
		user: { id: newUser.id, username: newUser.username, email }
	});
};
