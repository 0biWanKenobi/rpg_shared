import { DriveAppProperties, DriveFolder } from "./googleDriveOperations";

export const VAULT_ID_PROPERTY = "vaultId";

export async function getDriveFolderAppProperties(
    accessToken: string,
    folderId: string,
) {
    const params = new URLSearchParams({
        fields: "appProperties",
    });

    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${folderId}?${params}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    );

    if (!response.ok) {
        throw new Error(
            `Google Drive error ${response.status}: ${await response.text()}`
        );
    }

    return await response.json() as Pick<DriveFolder, "appProperties">;
}

export async function setDriveAppProperties(
    accessToken: string,
    fileId: string,
    appProperties: Record<string, string>,
) {
    const params = new URLSearchParams({
        fields: "id,appProperties",
    });

    const response = await fetch(
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
        throw new Error(
            `Google Drive error ${response.status}: ${await response.text()}`
        );
    }

    return await response.json() as {
        id: string;
        appProperties?: DriveAppProperties;
    };
}

export async function removeDriveAppProperty(
    accessToken: string,
    fileId: string,
    key: string,
) {
    const params = new URLSearchParams({
        fields: "id,appProperties",
    });

    const response = await fetch(
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
        throw new Error(
            `Google Drive error ${response.status}: ${await response.text()}`
        );
    }

    return await response.json();
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

    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?${params}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    );

    if (!response.ok) {
        throw new Error(
            `Google Drive error ${response.status}: ${await response.text()}`
        );
    }

    const { files = [], appProperties } = await response.json() as {
        files?: { id: string }[];
        appProperties?: DriveFolder['appProperties']
    };

    return !files.length
}