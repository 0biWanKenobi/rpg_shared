import { requestUrl } from "obsidian";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

type GoogleTokenSuccessResponse = {
	access_token: string;
	refresh_token?: string;
	expires_in: number;
	scope: string;
	token_type: string;
};

export type GoogleDriveTokenSet = {
	accessToken: string;
	refreshToken?: string;
	tokenType: string;
	scope: string;
	expiresAt: number;
};

const formBody = (params: Record<string, string>) => new URLSearchParams(params).toString();

export async function refreshGoogleDriveAccessToken(
	refreshToken: string,
) {

	if (!refreshToken) {
		throw new Error("No Google Drive refresh token is available.");
	}

	const response = await requestUrl({
		url: GOOGLE_TOKEN_URL,
		method: "POST",
		contentType: "application/x-www-form-urlencoded",
		body: formBody({
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
