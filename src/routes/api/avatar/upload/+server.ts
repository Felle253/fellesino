import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib';
import { user } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { validateSession } from '$lib/auth';
import { uploadAvatar } from '$lib/r2';

export const POST: RequestHandler = async (event) => {
	const sessionToken = event.cookies.get('sessionToken');
	if (!sessionToken) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const s = await validateSession(sessionToken);
	if (!s || !s.user) {
		event.cookies.delete('sessionToken', { path: '/' });
		return json({ error: 'Invalid session' }, { status: 401 });
	}

	const formData = await event.request.formData();
	const file = formData.get('avatar') as File | null;
	if (!file) {
		return json({ error: 'No file provided' }, { status: 400 });
	}

	if (!file.type.startsWith('image/')) {
		return json({ error: 'File must be an image' }, { status: 400 });
	}

	if (file.size > 5 * 1024 * 1024) {
		return json({ error: 'File must be under 5MB' }, { status: 400 });
	}

	try {
		const avatarUrl = await uploadAvatar(s.user.id, file);
		await db.update(user).set({ avatarUrl }).where(eq(user.id, s.user.id));
		return json({ success: true, avatarUrl });
	} catch (err) {
		console.error('R2 upload error:', err);
		return json({ error: 'Upload failed' }, { status: 500 });
	}
};
