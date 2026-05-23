import { describe, expect, it } from "vitest";
import { decryptObject, encryptObjectToBase64 } from "../src/sync/googleDriveTokenCrypto";

type SamplePayload = {
	accessToken: string;
	expiresAt: number;
	nested: {
		scope: string[];
	};
};

function toBase64Url(value: string): string {
	return Buffer.from(value, "utf8")
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/u, "");
}

describe("googleDriveTokenCrypto", () => {
	it("round-trips object payloads", async () => {
		const password = "correct horse battery staple";
		const payload: SamplePayload = {
			accessToken: "token-123",
			expiresAt: 1_715_000_000,
			nested: {
				scope: ["drive.file", "openid"],
			},
		};

		const encrypted = await encryptObjectToBase64(password, payload);
		const decrypted = await decryptObject<SamplePayload>(password, encrypted);

		expect(decrypted).toEqual(payload);
		expect(encrypted).not.toContain(payload.accessToken);
	});

	it("round trips string payloads", async () => {
		const password = "correct horse battery staple";
		const payload = "a token payload";
		const encrypted = await encryptObjectToBase64(password, payload);
		const decrypted = await decryptObject<string>(password, encrypted);

		expect(decrypted).toEqual(payload)
		expect(encrypted).not.toContain(payload);
	})

	it("rejects wrong password", async () => {
		const encrypted = await encryptObjectToBase64("right-password", { value: "secret" });

		await expect(decryptObject("wrong-password", encrypted)).rejects.toThrow();
	});

	it("rejects payloads that are not encrypted envelopes", async () => {
		const invalidPayload = toBase64Url(JSON.stringify({ salt: "x", iv: "y" }));

		await expect(decryptObject("password", invalidPayload)).rejects.toThrow(
			"Invalid encrypted Google Drive payload.",
		);
	});

	it("rejects corrupted ciphertext", async () => {
		const encrypted = await encryptObjectToBase64("password", { value: "secret" });
		const envelope = JSON.parse(Buffer.from(encrypted.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")) as {
			salt: string;
			iv: string;
			ciphertext: string;
		};
		const corrupted = toBase64Url(
			JSON.stringify({
				...envelope,
				ciphertext: `${envelope.ciphertext.slice(0, -1)}A`,
			}),
		);

		await expect(decryptObject("password", corrupted)).rejects.toThrow();
	});
});
