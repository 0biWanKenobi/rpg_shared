import { requestUrl } from "obsidian";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

type GoogleTokenSuccessResponse = {
	access_token: string;
	refresh_token?: string;
	expires_in: number;
	scope: string;
	token_type: string;
};

type GoogleRefreshResponse = {
	success: true
	access_token: string,
	expiresAt: number,
	error: undefined
} | {
	success: false,
	access_token: undefined,
	expiresAt: undefined,
	error: string,
}

export type GoogleDriveTokenSet = {
	accessToken: string;
	refreshToken?: string;
	expiresAt: number;
};

export async function refreshGoogleDriveAccessToken(
	baseUrl: string,
	refreshToken: string,
): Promise<GoogleRefreshResponse> {

	if (!refreshToken) {
		throw new Error("No Google Drive refresh token is available.");
	}

	const response = await fetch(`${baseUrl}oauthRefresh`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			refresh_token: refreshToken,
			grant_type: "refresh_token",
		}),
	});

	const tokenSet = await response.json() as GoogleRefreshResponse;

	if (tokenSet.success && (!("access_token" in tokenSet) || !("expiresAt" in tokenSet))) {
		return {
			success: false,
			error: "Missing token or expiration in response",
			access_token: undefined,
			expiresAt: undefined
		}
	}

	return tokenSet;
}
