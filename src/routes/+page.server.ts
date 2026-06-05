import { validateSession } from '$lib/auth';

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
