import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const accessKeyId = () => process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = () => process.env.R2_SECRET_ACCESS_KEY;
const accountId = () => process.env.R2_ACCOUNT_ID;
const bucket = () => process.env.R2_BUCKET || 'fellesino-avatars';
const publicUrl = () => process.env.R2_PUBLIC_URL || '';

let _client: S3Client | null = null;

function getClient(): S3Client {
	if (_client) return _client;
	const aki = accessKeyId();
	const sak = secretAccessKey();
	const aid = accountId();
	if (!aki || !sak || !aid) {
		throw new Error('R2 credentials not configured');
	}
	_client = new S3Client({
		region: 'auto',
		endpoint: `https://${aid}.r2.cloudflarestorage.com`,
		credentials: { accessKeyId: aki, secretAccessKey: sak }
	});
	return _client;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
	const ext = file.name.split('.').pop() || 'jpg';
	const key = `avatars/${userId}.${ext}`;
	const buffer = Buffer.from(await file.arrayBuffer());

	await getClient().send(new PutObjectCommand({
		Bucket: bucket(),
		Key: key,
		Body: buffer,
		ContentType: file.type
	}));

	const pub = publicUrl();
	return pub ? `${pub}/${key}` : `https://${bucket()}.${accountId()}.r2.dev/${key}`;
}
