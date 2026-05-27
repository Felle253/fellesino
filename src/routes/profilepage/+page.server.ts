import { requireAuth } from '$lib/auth';

export async function load(event) {
	const user = await requireAuth(event.cookies);
	return { user };
}
