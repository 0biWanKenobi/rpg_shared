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
	})
	.catch( err => {
		console.debug("Cannot refresh Drive token", err);
	});

	if(!response){
		return {
			success: false,
			error: "Connection with Google API failed",
			access_token: undefined,
			expiresAt: undefined
		}
	}

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
