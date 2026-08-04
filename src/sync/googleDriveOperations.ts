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