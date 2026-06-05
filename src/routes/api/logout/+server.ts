import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib';
import { session } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async (event) => {
	const sessionToken = event.cookies.get('sessionToken');

	if (sessionToken) {
		await db.delete(session).where(eq(session.token, sessionToken));
	}

	event.cookies.delete('sessionToken', { path: '/' });

	return json({ success: true });
};
