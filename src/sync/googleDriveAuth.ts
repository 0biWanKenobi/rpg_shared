import { App, Notice, requestUrl } from "obsidian";
import { GoogleDriveConnectModal } from "./googleDriveConnectModal";

const GOOGLE_DEVICE_CODE_URL = "https://oauth2.googleapis.com/device/code";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const DEVICE_GRANT_TYPE = "urn:ietf:params:oauth:grant-type:device_code";

type GoogleDeviceCodeResponse = {
	device_code: string;
	user_code: string;
	verification_url: string;
	expires_in: number;
	interval?: number;
};

type GoogleTokenSuccessResponse = {
	access_token: string;
	refresh_token?: string;
	expires_in: number;
	scope: string;
	token_type: string;
};

type GoogleTokenErrorResponse = {
	error: string;
	error_description?: string;
};

export type GoogleDriveOAuthConfig = {
	clientId: string;
	clientSecret: string;
	scope?: string;
};

export type GoogleDriveTokenSet = {
	accessToken: string;
	refreshToken?: string;
	tokenType: string;
	scope: string;
	expiresAt: number;
};

const formBody = (params: Record<string, string>) => new URLSearchParams(params).toString();

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const getRequiredScope = (config: GoogleDriveOAuthConfig) =>
	config.scope ?? "https://www.googleapis.com/auth/drive.file";

const validateConfig = (config: GoogleDriveOAuthConfig) => {
	if (!config.clientId || !config.clientSecret) {
		throw new Error("Google OAuth client settings are missing.");
	}
};

async function requestDeviceCode(config: GoogleDriveOAuthConfig) {
	validateConfig(config);

	const response = await requestUrl({
		url: GOOGLE_DEVICE_CODE_URL,
		method: "POST",
		contentType: "application/x-www-form-urlencoded",
		body: formBody({
			client_id: config.clientId,
			scope: getRequiredScope(config),
		}),
	});

	return response.json as GoogleDeviceCodeResponse;
}

async function pollForTokens(
	config: GoogleDriveOAuthConfig,
	deviceCode: string,
	initialIntervalSeconds: number,
	modal: GoogleDriveConnectModal,
) {
	let intervalSeconds = initialIntervalSeconds;

	for (;;) {

		await sleep(intervalSeconds * 1000);

		const response = await requestUrl({
			url: GOOGLE_TOKEN_URL,
			method: "POST",
			contentType: "application/x-www-form-urlencoded",
			body: formBody({
				client_id: config.clientId,
				client_secret: config.clientSecret,
				device_code: deviceCode,
				grant_type: DEVICE_GRANT_TYPE,
			}),
			throw: false,
		});

		if (response.status < 400) {
			return response.json as GoogleTokenSuccessResponse;
		}

		const errorResponse = response.json as GoogleTokenErrorResponse;
		switch (errorResponse.error) {
			case "authorization_pending":
				modal.setStatus("Waiting for Google sign-in…", "loader");
				continue;
			case "slow_down":
				intervalSeconds += 5;
				modal.setStatus("Google asked us to slow down a bit. Still waiting…", "loader");
				continue;
			case "access_denied":
				throw new Error("Google Drive access was denied.");
			case "expired_token":
				throw new Error("The Google verification code expired. Please try again.");
			default:
				throw new Error(errorResponse.error_description ?? errorResponse.error ?? "Google Drive authentication failed.");
		}
	}
}

export async function connectGoogleDrive(app: App, config: GoogleDriveOAuthConfig) {
	const modal = new GoogleDriveConnectModal(app);

	try {
		const deviceAuthorization = await requestDeviceCode(config);
		const intervalSeconds = Math.max(deviceAuthorization.interval ?? 5, 5);

		modal.open();
		const cancelled = await modal.showDeviceAuthorizationAsync({
			userCode: deviceAuthorization.user_code,
			verificationUrl: deviceAuthorization.verification_url,
			expiresIn: deviceAuthorization.expires_in,
		});

		if(cancelled) return;

		const token = await pollForTokens(
			config,
			deviceAuthorization.device_code,
			intervalSeconds,
			modal,
		);

		modal.setStatus("Google Drive connected.", "check");
		new Notice("Google Drive connected.");
		window.setTimeout(() => modal.close(), 800);

		return {
			accessToken: token.access_token,
			refreshToken: token.refresh_token,
			tokenType: token.token_type,
			scope: token.scope,
			expiresAt: Date.now() + token.expires_in * 1000,
		} satisfies GoogleDriveTokenSet;
	} catch (error) {
		const message = error instanceof Error ? error.message : "Google Drive connection failed.";
		new Notice(message);
		throw error;
	}
}

export async function refreshGoogleDriveAccessToken(
	config: GoogleDriveOAuthConfig,
	refreshToken: string,
) {
	validateConfig(config);

	if (!refreshToken) {
		throw new Error("No Google Drive refresh token is available.");
	}

	const response = await requestUrl({
		url: GOOGLE_TOKEN_URL,
		method: "POST",
		contentType: "application/x-www-form-urlencoded",
		body: formBody({
			client_id: config.clientId,
			client_secret: config.clientSecret,
			refresh_token: refreshToken,
			grant_type: "refresh_token",
		}),
	});

	const token = response.json as GoogleTokenSuccessResponse;
	return {
		accessToken: token.access_token,
		refreshToken,
		tokenType: token.token_type,
		scope: token.scope,
		expiresAt: Date.now() + token.expires_in * 1000,
	} satisfies GoogleDriveTokenSet;
}
