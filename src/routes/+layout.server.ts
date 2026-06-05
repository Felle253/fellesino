import { validateSession } from '$lib/auth';

export async function load(event) {
	const sessionToken = event.cookies.get('sessionToken');
	if (!sessionToken) return { user: null };

	const session = await validateSession(sessionToken);
	if (!session || !session.user) {
		event.cookies.delete('sessionToken', { path: '/' });
		return { user: null };
	}

	return { user: session.user };
}
