interface DriveFolder {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
}

type CreateFolderResponse = {
  success: true;
  folder: DriveFolder;
} | {
  success: false;
  error: string;
  errorMessage: string;
  folder?: undefined;
};

export async function createFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<CreateFolderResponse> {
  const response = await fetch(
    "https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,parents",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        ...(parentFolderId && {
          parents: [parentFolderId],
        }),
      }),
    }
  ).catch( err => {
		console.debug(`Cannot create Drive folder ${folderName}`, err);
 });

  if (!response?.ok) {
    return {
        success: false,
        error: `Google Drive error ${response?.status}. Response: ${ response ? await response.text() : "Unknown error" }`,
        errorMessage: `Cannot create folder ${folderName} on Google Drive`,
    }
  }

  const folder = await response.json() as DriveFolder;
  return { success: true, folder };
}

type RenameFolderResponse = {
  success: true;
} | {
  success: false;
  error: string;
  errorMessage: string;
};

export async function renameFolder(
  accessToken: string,
  folderId: string,
  newFolderName: string
): Promise<RenameFolderResponse> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType,parents`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newFolderName,
      }),
    }
  ).catch( err => {
    console.error(`Cannot rename Drive folder ${folderId} to ${newFolderName}`, err);
 });  

  if(!response?.ok) {
    return {
        success: false,
        error: `Google Drive error ${response?.status}. Response: ${ response ? await response.text() : "Unknown error" }`,
        errorMessage: `Cannot rename folder to ${newFolderName}`,
    }
  }

  return { success: true };

}

type DeleteFolderResponse = RenameFolderResponse

export async function deleteFolder(
  accessToken: string,
  folderId: string
): Promise<DeleteFolderResponse> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${folderId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  ).catch( err => {
    console.error(`Cannot delete Drive folder ${folderId}}`, err)
  })

  if(!response?.ok) {
    return {
        success: false,
        error: `Google Drive error ${response?.status}. Response: ${ response ? await response.text() : "Unknown error" }`,
        errorMessage: "Cannot delete folder",
    }
  }

  return { success: true };
}


/** Minimal Drive metadata required for document sync. */
export type DriveDocumentMetadata = {
	id: string;
	name: string;
	sha256Checksum?: string;
	version?: string;
	modifiedTime?: string;
};


/** Finds the Drive file associated with an RPG document ID. */
export async function findDriveDocumentByDocId(
	accessToken: string,
	folderId: string,
	docId: string,
) {
	const q = [
		`'${folderId}' in parents`,
		`appProperties has { key='rpgDocId' and value='${docId}' }`,
		"trashed = false",
	].join(" and ");

	const params = new URLSearchParams({
		q,
		fields: "files(id,name,sha256Checksum,version,modifiedTime)",
		pageSize: "2",
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
    return {
      success: false as const,
      error: `Google Drive error ${response.status}. Response: ${ await response.text() }`,
      errorMessage: `Drive lookup failed for RPG document ${docId}`,
    }
	}

	const files = (await response.json() as {
		files?: DriveDocumentMetadata[];
	}).files ?? [];

	if (!files.length) return {
    success: true as const,
    noMetadata: true as const
  };

	if (files.length > 1) {
    return {
      success: false as const,
      error: "Multiple files found",
      errorMessage: `Multiple Drive files found for RPG document ${docId}`,
    }
	}

	return {
    metadata: files[0] as DriveDocumentMetadata,
    success: true as const
  };
}


export async function createDriveDocument(
	accessToken: string,
	folderId: string,
	docId: string,
	name: string,
	content: string,
): Promise<
	| { success: true; metadata: DriveDocumentMetadata }
	| { success: false; error: string; errorMessage: string }
> {
	const boundary = `rpg_${crypto.randomUUID()}`;

	const fileMetadata = {
		name,
		parents: [folderId],
		mimeType: "text/markdown",
		appProperties: {
			rpgDocId: docId,
		},
	};

	const body = [
		`--${boundary}`,
		"Content-Type: application/json; charset=UTF-8",
		"",
		JSON.stringify(fileMetadata),
		`--${boundary}`,
		"Content-Type: text/markdown; charset=UTF-8",
		"",
		content,
		`--${boundary}--`,
	].join("\r\n");

	const params = new URLSearchParams({
		uploadType: "multipart",
		fields: "id,name,sha256Checksum,version,modifiedTime",
	});

	const response = await fetch(
		`https://www.googleapis.com/upload/drive/v3/files?${params}`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": `multipart/related; boundary=${boundary}`,
			},
			body,
		},
	);

	if (!response.ok) {
		return {
			success: false,
			error: `Google Drive error ${response.status}. Response: ${await response.text()}`,
			errorMessage: `Failed to create Drive file for RPG document ${docId}`,
		};
	}

	return {
		success: true,
		metadata: await response.json() as DriveDocumentMetadata,
	};
}

/** Replaces the contents of an existing Drive document. */
export async function updateDriveDocument(
	accessToken: string,
	fileId: string,
	content: string,
): Promise<
	| { success: true; metadata: DriveDocumentMetadata }
	| { success: false; error: string; errorMessage: string }
> {
	const params = new URLSearchParams({
		uploadType: "media",
		fields: "id,name,sha256Checksum,version,modifiedTime",
	});

	const response = await fetch(
		`https://www.googleapis.com/upload/drive/v3/files/${fileId}?${params}`,
		{
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "text/markdown; charset=UTF-8",
			},
			body: content,
		},
	);

	if (!response.ok) {
		return {
			success: false,
			error: `Google Drive error ${response.status}. Response: ${await response.text()}`,
			errorMessage: `Failed to update Drive document ${fileId}`,
		};
	}

	return {
		success: true,
		metadata: await response.json() as DriveDocumentMetadata,
	};
}

/** Downloads the contents of a Drive document. */
export async function downloadDriveDocument(
	accessToken: string,
	fileId: string,
): Promise<
	| { success: true; content: string }
	| { success: false; error: string; errorMessage: string }
> {
	const response = await fetch(
		`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		},
	);

	if (!response.ok) {
		return {
			success: false,
			error: `Google Drive error ${response.status}. Response: ${await response.text()}`,
			errorMessage: `Failed to download Drive document ${fileId}`,
		};
	}

	return {
		success: true,
		content: await response.text(),
	};
}