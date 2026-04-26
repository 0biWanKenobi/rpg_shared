import type { GoogleDriveTokenSet } from "./googleDriveAuth";

export type GoogleDriveEncryptedTokenEnvelope = {
	version: "1";
	alg: "A256GCM";
	kdf: "PBKDF2-SHA256";
	iterations: number;
	salt: string;
	iv: string;
	ciphertext: string;
}

function toBase64Url(bytes: Uint8Array): string {
	const base64 = btoa(String.fromCharCode(...bytes));
	return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function fromBase64Url(value: string): Uint8Array {
	const padding = (4 - (value.length % 4)) % 4;
	const normalized = value
		.replace(/-/g, "+")
		.replace(/_/g, "/")
		.padEnd(value.length + padding, "=");
	const binary = atob(normalized);
	return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

const keyType = Object.freeze({ name: "AES-GCM", length: 256 }) ;
const GOOGLE_DRIVE_ENCRYPTION_ITERATIONS = 250_000;

export type GoogleDriveSetupContext = {
	setupId: string;
	setupKey: string;
};

export type GoogleDriveSetupLaunchContext = GoogleDriveSetupContext & {
	authUrl: string;
};

async function deriveEncryptionKey(
	password: string,
	salt: Uint8Array,
	iterations: number,
	usages: KeyUsage[],
): Promise<CryptoKey> {
	const keyData = Uint8Array.from(new TextEncoder().encode(password));
	const baseKey = await crypto.subtle.importKey( "raw", keyData, "PBKDF2", false, ["deriveKey"] );

	const uint8Salt = Uint8Array.from(salt); 
	return crypto.subtle.deriveKey(
		{ name: "PBKDF2", hash: "SHA-256", salt: uint8Salt, iterations },
		baseKey, keyType, false, usages
	);
}

function isEncryptedTokenEnvelope(
	value: Partial<GoogleDriveEncryptedTokenEnvelope>,
): value is GoogleDriveEncryptedTokenEnvelope {
	return (
		value.version === "1" &&
		value.alg === "A256GCM" &&
		value.kdf === "PBKDF2-SHA256" &&
		typeof value.iterations === "number" &&
		typeof value.salt === "string" &&
		typeof value.iv === "string" &&
		typeof value.ciphertext === "string"
	);
}

export function createGoogleDriveSetupContext(authUrl: string): GoogleDriveSetupLaunchContext {
	const url = new URL(authUrl);
	const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
	hashParams.set("setup_id", crypto.randomUUID());
	hashParams.set("setup_key", toBase64Url(crypto.getRandomValues(new Uint8Array(32))));
	url.hash = hashParams.toString();

	return Object.freeze({
		setupId: hashParams.get("setup_id") as string,
		setupKey: hashParams.get("setup_key") as string,
		authUrl: url.toString(),
	});
}

export async function encryptGoogleDriveTokenSet(
	password: string,
	tokenSet: GoogleDriveTokenSet,
): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const key = await deriveEncryptionKey(password, salt, GOOGLE_DRIVE_ENCRYPTION_ITERATIONS, ["encrypt"]);
	const ciphertext = new Uint8Array(
		await crypto.subtle.encrypt(
			{ name: "AES-GCM", iv: Uint8Array.from(iv) },
			key,
			Uint8Array.from(new TextEncoder().encode(JSON.stringify(tokenSet)))
		),
	);

	return toBase64Url(new TextEncoder().encode(JSON.stringify({
		version: "1",
		alg: "A256GCM",
		kdf: "PBKDF2-SHA256",
		iterations: GOOGLE_DRIVE_ENCRYPTION_ITERATIONS,
		salt: toBase64Url(salt),
		iv: toBase64Url(iv),
		ciphertext: toBase64Url(ciphertext),
	} satisfies GoogleDriveEncryptedTokenEnvelope)));
}

export async function decryptGoogleDriveTokenSet(
	password: string,
	payload: string,
): Promise<GoogleDriveTokenSet> {
	const envelope = JSON.parse(
		new TextDecoder().decode(fromBase64Url(payload))
	) as Partial<GoogleDriveEncryptedTokenEnvelope>;

	if (!isEncryptedTokenEnvelope(envelope)) {
		throw new Error("Invalid encrypted Google Drive payload.");
	}

	const key = await deriveEncryptionKey(password, fromBase64Url(envelope.salt), envelope.iterations, ["decrypt"]);
	const plaintext = await crypto.subtle.decrypt(
		{ name: "AES-GCM", iv: Uint8Array.from(fromBase64Url(envelope.iv)) },
		key,
		Uint8Array.from(fromBase64Url(envelope.ciphertext)),
	);
	const tokenSet = JSON.parse(new TextDecoder().decode(plaintext)) as Partial<GoogleDriveTokenSet>;

	if (
		typeof tokenSet.accessToken !== "string" ||
		typeof tokenSet.tokenType !== "string" ||
		typeof tokenSet.scope !== "string" ||
		typeof tokenSet.expiresAt !== "number"
	) {
		throw new Error("Decrypted Google Drive payload is incomplete.");
	}

	return Object.freeze(tokenSet) as GoogleDriveTokenSet;
}
