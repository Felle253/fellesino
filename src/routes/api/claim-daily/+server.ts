import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib';
import { user } from '../../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { validateSession } from '$lib/auth';

export const POST: RequestHandler = async (event) => {
	const sessionToken = event.cookies.get('sessionToken');

	if (!sessionToken) {
		return json({ error: 'You must be signed in to claim daily coins.' }, { status: 401 });
	}

	const s = await validateSession(sessionToken);

	if (!s || !s.user) {
		event.cookies.delete('sessionToken', { path: '/' });
		return json({ error: 'Invalid session.' }, { status: 401 });
	}

	const foundUser = s.user;
	const now = new Date();
	const lastClaimed = foundUser.lastClaimed;

	if (lastClaimed && (now.getTime() - new Date(lastClaimed).getTime() < 24 * 60 * 60 * 1000)) {
		const msRemaining = 24 * 60 * 60 * 1000 - (now.getTime() - new Date(lastClaimed).getTime());
		const hours = Math.floor(msRemaining / (1000 * 60 * 60));
		const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
		return json({ error: `Next claim available in ${hours}h ${minutes}m.` }, { status: 400 });
	}

	await db
		.update(user)
		.set({
			coins: sql`${user.coins} + 250`,
			lastClaimed: now
		})
		.where(eq(user.id, foundUser.id));

	return json({ success: true });
};
