import { describe, expect, it } from "vitest"

describe("googleDriveAuth", () => {
    it("refreshes expired auth token", async () => {

        const refreshToken = process.env.TEST_REFRESH_TOKEN;
        const GOOGLE_TOKEN_URL = "http://127.0.0.1:5173/oauthRefresh";
        expect(GOOGLE_TOKEN_URL).toBeTruthy();
        let catchedError = undefined;
        try {
            const response = await fetch(GOOGLE_TOKEN_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    refresh_token: refreshToken,
                    grant_type: "refresh_token",
                }),
            });
            const data = await response.json()
            expect(data).toBeTruthy()
        } catch (error) {
            console.error(error)
            catchedError = error;
        }
        finally {
            expect(catchedError).toBeFalsy()
        }

    })
})