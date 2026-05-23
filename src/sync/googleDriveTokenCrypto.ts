import { sc_importKey, sc_deriveKey, sc_randUUID, sc_randValues, sc_encrypt, sc_decrypt } from "../crypto";
import type { GoogleDriveTokenSet } from "./googleDriveAuth";

export type EncryptedTokenEnvelope = {
	salt: string;
	iv: string;
	ciphertext: string;
}

function toBase64Url(bytes: Uint8Array): string {
	const base64 = btoa(String.fromCharCode(...bytes));
	return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
	const padding = (4 - (value.length % 4)) % 4;
	const normalized = value
		.replace(/-/g, "+")
		.replace(/_/g, "/")
		.padEnd(value.length + padding, "=");
	const binary = atob(normalized);
	return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

const keyType = Object.freeze({ name: "AES-GCM", length: 256 });
const ENCRYPTION_ITERATIONS = 250_000;

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
	const baseKey = await sc_importKey("raw", keyData, "PBKDF2", false, ["deriveKey"]);

	const uint8Salt = Uint8Array.from(salt);
	return sc_deriveKey(
		{ name: "PBKDF2", hash: "SHA-256", salt: uint8Salt, iterations },
		baseKey, keyType, false, usages
	);
}

function isEncryptedTokenEnvelope(
	value: Partial<EncryptedTokenEnvelope>,
): value is EncryptedTokenEnvelope {
	return (
		typeof value.salt === "string" &&
		typeof value.iv === "string" &&
		typeof value.ciphertext === "string"
	);
}

export function createGoogleDriveSetupContext(authUrl: string): GoogleDriveSetupLaunchContext {
	const url = new URL(authUrl);
	const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
	hashParams.set("setup_id", sc_randUUID());
	hashParams.set("setup_key", toBase64Url(sc_randValues(new Uint8Array(32))));
	url.hash = hashParams.toString();

	return Object.freeze({
		setupId: hashParams.get("setup_id") as string,
		setupKey: hashParams.get("setup_key") as string,
		authUrl: url.toString(),
	});
}


async function encryptText(
	password: string,
	text: string
) {
	const salt = sc_randValues(new Uint8Array(16));
	const iv = sc_randValues(new Uint8Array(12));
	const key = await deriveEncryptionKey(password, salt, ENCRYPTION_ITERATIONS, ["encrypt"]);
	const ciphertext = new Uint8Array(
		await sc_encrypt(
			{ name: "AES-GCM", iv: Uint8Array.from(iv) },
			key,
			Uint8Array.from(new TextEncoder().encode(text))
		),
	);

	return {
		salt,
		iv,
		ciphertext
	}
}


export async function encryptObjectToBase64<T>(
	password: string,
	object: T,
): Promise<string> {

	const { salt, iv, ciphertext } = await encryptText(password, JSON.stringify(object));

	return toBase64Url(new TextEncoder().encode(JSON.stringify({
		salt: toBase64Url(salt),
		iv: toBase64Url(iv),
		ciphertext: toBase64Url(ciphertext),
	} satisfies EncryptedTokenEnvelope)));
}

export async function decryptGoogleDriveTokenSet(
	password: string,
	payload: string,
): Promise<GoogleDriveTokenSet> {

	const tokenSet = await decryptObject<Partial<GoogleDriveTokenSet>>(password, payload);

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

export async function decryptObject<TEncrypted>(
	password: string,
	payload: string,
): Promise<TEncrypted> {
	const envelope = JSON.parse(
		new TextDecoder().decode(fromBase64Url(payload))
	) as Partial<EncryptedTokenEnvelope>;

	if (!isEncryptedTokenEnvelope(envelope)) {
		throw new Error("Invalid encrypted Google Drive payload.");
	}

	const key = await deriveEncryptionKey(password, fromBase64Url(envelope.salt), ENCRYPTION_ITERATIONS, ["decrypt"]);
	const plaintext = await sc_decrypt(
		{ name: "AES-GCM", iv: fromBase64Url(envelope.iv) },
		key,
		fromBase64Url(envelope.ciphertext),
	);
	return JSON.parse(new TextDecoder().decode(plaintext)) as TEncrypted;
}