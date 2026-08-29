import { DriveAppProperties, DriveFolder } from "./googleDriveOperations";

export const VAULT_ID_PROPERTY = "vaultId";

export async function getDriveFolderAppProperties(
    accessToken: string,
    folderId: string,
) {
    let response: Response | undefined = undefined;

    try {
        const params = new URLSearchParams({
            fields: "appProperties",
        });
    
        response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${folderId}?${params}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        );
    
        if (!response.ok) {
            return {
                success: false as const,
                error: `Google Drive error ${response.status}: ${await response.text()}`,
                errorMessage: `Could not query Google Drive`
            }
        }
        
    } catch (error) {
        return {
            success: false as const,
            error: `Google Drive error ${error}`,
            errorMessage: `Could not query Google Drive`
        }
    }

    try {
        const data = await response.json() as Pick<DriveFolder, "appProperties">;
        return {
            success: true as const,
            data
        }
    } catch (error) {
        return {
            success: false as const,
            error: `Error deserializing Google Drive API response: ${error}`,
            errorMessage: `Could not query Google Drive`
        }
    }
}

export async function setDriveAppProperties(
    accessToken: string,
    fileId: string,
    appProperties: Record<string, string>,
) {
    const params = new URLSearchParams({
        fields: "id,appProperties",
    });

    let response: Response | undefined = undefined;

    try {
        response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?${params}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    appProperties,
                }),
            },
        );
    
        if (!response.ok) {
            return  {
                success: false as const,
                error: `Google Drive API error ${response.status}: ${await response.text()}`,
                errorMessage: 'Could not configure folder properties on Drive',
            }
        }
    }
    catch(error) {
        return {
            success: false as const,
            error: `Google Drive API error: ${error}.`,
            errorMessage: 'Could not configure folder properties on Drive'
        }
    }

    try {
        const data = await response.json() as {
            id: string;
            appProperties?: DriveAppProperties;
        };

        return {
            success: true as const,
            data
        }
    } catch (error) {
        return {
            success: false as const,
            error: `Error deserializing Google Drive API response: ${error}`,
            errorMessage: 'Could not configure folder properties on Drive'
        }
    }
}

export async function removeDriveAppProperty(
    accessToken: string,
    fileId: string,
    key: string,
) {
    const params = new URLSearchParams({
        fields: "id,appProperties",
    });

    let response: Response | undefined = undefined;

    try {
        response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?${params}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    appProperties: {
                        [key]: null,
                    },
                }),
            },
        );

        if (!response.ok) {
            return {
                success: false as const,
                error: `Google Drive API error ${response.status}: ${await response.text()}`,
                errorMessage: "Could not remove folder property on Drive",
            };
        }
    } catch (error) {
        return {
            success: false as const,
            error: `Google Drive API error: ${error}.`,
            errorMessage: "Could not remove folder property on Drive",
        };
    }

    try {
        const data = await response.json() as {
            id: string;
            appProperties?: DriveAppProperties;
        };

        return {
            success: true as const,
            data,
        };
    } catch (error) {
        return {
            success: false as const,
            error: `Error deserializing Google Drive API response: ${error}`,
            errorMessage: "Could not remove folder property on Drive",
        };
    }
}

/**
 * Checks if a Drive folder can become a sync target for an Obsidian Vault.
 * Such a folder would be the root of all files and folders uploaded from the Vault.
 * 
 * @param accessToken Google API token
 * @param folderId id of folder in Drive
 * @returns an object with shape `{hasFiles: boolean, isVault: boolean}`
 */
export async function isDriveFolderEmpty(
    accessToken: string,
    folderId: string,
) {
    const params = new URLSearchParams({
        q: `'${folderId}' in parents and trashed = false`,
        pageSize: "1",
        fields: "files(id)",
    });

    let response: Response | undefined = undefined;

    try {
        response = await fetch(
            `https://www.googleapis.com/drive/v3/files?${params}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        );

        if (!response.ok) {
            return {
                success: false as const,
                error: `Google Drive API error ${response.status}: ${await response.text()}`,
                errorMessage: "Could not check whether Drive folder is empty",
            };
        }
    } catch (error) {
        return {
            success: false as const,
            error: `Google Drive API error: ${error}.`,
            errorMessage: "Could not check whether Drive folder is empty",
        };
    }

    try {
        const { files = [] } = await response.json() as {
            files?: { id: string }[];
        };

        return {
            success: true as const,
            isEmpty: !files.length,
        };
    } catch (error) {
        return {
            success: false as const,
            error: `Error deserializing Google Drive API response: ${error}`,
            errorMessage: "Could not check whether Drive folder is empty",
        };
    }
}
