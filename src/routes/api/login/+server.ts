import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib';
import { user } from '../../../db/schema';
import { or, eq } from 'drizzle-orm';
import { createSession, validatePassword, dummyHash } from '$lib/auth';
import { decryptEmail, hashEmail } from '$lib/encryption';

const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

export const POST: RequestHandler = async (event) => {
	const formData = await event.request.formData();
	const identifierInput = (formData.get('identifier') as string || '').trim();
	const identifier = identifierInput.toLowerCase();
	const password = (formData.get('password') as string || '').trim();

	if (!identifierInput || !password) {
		return json({ error: 'Username/email and password are required.', activeTab: 'login' }, { status: 400 });
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
		return json({ error: 'Invalid credentials.', activeTab: 'login' }, { status: 400 });
	}

	const isValid = validatePassword(password, foundUser.passwordSalt, foundUser.passwordHash);
	if (!isValid) {
		return json({ error: 'Invalid credentials.', activeTab: 'login' }, { status: 400 });
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

	return json({
		success: true,
		user: { id: foundUser.id, username: foundUser.username, email: decryptedEmail }
	});
};
