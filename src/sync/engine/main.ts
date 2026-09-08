import type { TAbstractFile } from "obsidian";
import type { drive_v3 } from "@googleapis/drive";
import type { ChangeData, RemoteEntry, SyncEngine, VaultEvent } from "./types";
import type { Result } from "../../types";

type Path = string;



let syncing = false;
const workQueue: Map<Path, ChangeData> = new Map();

function queueForSync(
    item: TAbstractFile, event: VaultEvent, oldPath?: string) {

    if(event === "rename" ) {
        if(!oldPath)
            throw new Error("Old path must be provided for rename events");

        const previousChange = workQueue.get(oldPath);
        workQueue.delete(oldPath);

        workQueue.set(item.path, {
            path: item.path,
            prevPath: previousChange?.prevPath ?? oldPath,
        });
        return;
    }

    workQueue.set(item.path, {
        path: item.path,
        prevPath: oldPath
    })
}

function requestSync(
    onStart: () => void,
    onProgress: (progress: number) => void,
    onComplete: () => void,
    onError: (error: Error) => void

){
    if(syncing) return {
        success: false,
        message: "Sync already in progress"
    }
    syncing = true;
    onStart();
    
    for (const [path, file] of workQueue) {
        
    }



    try {
        //TODO: implementation
        onProgress(0.5); // Example progress update
        
    } catch (error) {
        syncing = false;
        onError(error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            message: "Sync failed"
        }
    }

    syncing = false;
    onComplete();
    return {
        success: true,
        message: "Sync completed successfully"
    }    
}

function getSyncCandidates(): string[] {
    /**
     * TODO: Implement logic to retrieve a list of sync candidates.
     *  ## manual sync
     * - read from sqlite db files with mtime older than mtime reported by Obsidian
     * 
     * ## automatic sync
     * - vault opens, initial sync state check
     * - when Obsidian triggers a "create", "modify", "delete" or "rename" event
     * 
     * This could involve checking local files, database entries, or other sources.
     * For now, we return an empty array as a placeholder.
     */
    return [];

}

export type VaultScanParams = {
    folderId: string;
    accessToken: string;
    orderBy?: 'name' | 'modifiedTime';
    pageToken?: string;
    pageSize?: number;
}


const INVENTORY_FILE_FIELDS = [
    "id",
    "name",
    "mimeType",
    "parents",
    "size",
    "sha256Checksum",
    "headRevisionId",
    "modifiedTime",
    "appProperties",
].join(",");

/**
 * Scans a cloud folder for files and returns the results.
 * To be used by a higher-order function that scans the entire cloud folder tree recursively.
 * @param param0 
 */
async function cloudFolderScan({
    accessToken,
    folderId,
    pageToken,
    pageSize = 1000
}: VaultScanParams){
    const q = [
            `'${folderId}' in parents`,
            `trashed = false`,
        ].join(" and ");


    const params = new URLSearchParams({
        q,
        spaces: "drive",
        fields: `nextPageToken, files(${INVENTORY_FILE_FIELDS})`,
        pageSize: String(pageSize < 1 ? 1 : (pageSize > 1000 ? 1000 : pageSize)),
    });

    if (pageToken) {
        params.set("pageToken", pageToken);
    }

    try {
        const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        
        if(!res.ok) {
            return {
                success: false as const,
                error: `Drive folder listing failed (${res.status}): ${await res.text()}`,
                errorMessage: `Drive folder listing failed`
            }
        }
        const data = await res.json() as drive_v3.Schema$FileList;

        return {
            success: true as const,
            data: {
                files: data.files ?? [],
                nextPageToken: data.nextPageToken,
            }
        }

    } catch (error) {
        return {
            success: false as const,
            error: `Drive folder listing failed: ${error instanceof Error ? error.message : String(error)}`,
            errorMessage: `Drive folder listing failed`
        }
    }
}

async function cloudFolderFullScan(params: VaultScanParams){
    const res = await cloudFolderScan(params);
    if(!res.success){
        return res
    }
    
    else {
        var files = res.data.files;
        var nextPageToken = res.data.nextPageToken;
        while(nextPageToken){
            let nextRes = await cloudFolderScan({
                accessToken: params.accessToken,
                folderId: params.folderId,
                pageSize: params.pageSize,
                pageToken: nextPageToken
            })
            if(nextRes.success) {
                files = files.concat(nextRes.data.files);
                nextPageToken = nextRes.data.nextPageToken
            }
            else return nextRes
        }
        
        return {
            success: true as const,
            data: {
                files,
                nextPageToken: undefined
            }
        }
    }
}

async function cloudVaultScan(
    params: VaultScanParams,
): Promise<Result<drive_v3.Schema$File[]>> {
    const files: drive_v3.Schema$File[] = [];
    const folderQueue = [params.folderId];
    const concurrency = 5;

    while (folderQueue.length > 0) {
        const batch = folderQueue.splice(0, concurrency);

        const results = await Promise.all(
            batch.map(folderId =>
                cloudFolderFullScan({
                    accessToken: params.accessToken,
                    pageSize: params.pageSize,
                    folderId,
                    pageToken: undefined,
                })
            )
        );

        for (const result of results) {
            if (!result.success) {
                return result;
            }

            result.data.files.forEach(f => files.push(f))
            for (const file of result.data.files) {
                if (
                    file.mimeType === "application/vnd.google-apps.folder" &&
                    file.id
                ) {
                    folderQueue.push(file.id);
                }
            }
        }
    }

    return {
        success: true,
        data: files,
    };
}


function getPath(
    file: drive_v3.Schema$File,
    folderId: string,
    fileMap: Map<string, drive_v3.Schema$File>
) {
    let path = "";

    let parentId: string | null | undefined = file.parents?.[0];
    while(parentId && parentId !== folderId) {
        const parentItem = fileMap.get(parentId);
        if(!parentItem?.name) 
            return undefined;

        path = parentItem.name + "/" + path;
        parentId = parentItem.parents?.[0]
    }
    if(parentId !== folderId) return undefined;
    return path ? path.slice(0,-1) : path;
}

async function getRemoteSnapshot(params: VaultScanParams): Promise<Result<RemoteEntry[]>> {
    const result = await cloudVaultScan(params);

    if (!result.success) {
        return result;
    }

    const fileMap: Map<string, drive_v3.Schema$File> = new Map();

    for (const f of result.data) {
        var parentId = f.parents?.[0];
        if(  !f.id || !f.mimeType || !f.name || !parentId)
            return {
                success: false as const,
                error: `Missing parent for file ${f.id}`,
                errorMessage: "Incomplete Drive response"
                
            };
        fileMap.set(f.id, f);
    }

    var mapped: RemoteEntry[] = [];
    for (const f of result.data) {
        var path = getPath(f, params.folderId, fileMap);
        var parentId = f.parents?.[0];
        if(path === undefined){
            return {
                success: false as const,
                error: `Could not resolve the parent chain for file ${f.id}`,
                errorMessage: "Drive changed while it was being scanned",
            }
        }
        mapped.push({
                id: f.id!,
                name: f.name!,
                parentId: parentId!,
                path: path,
                type: f.mimeType  == "application/vnd.google-apps.folder" ? "folder" : "file",
                modifiedTime: f.modifiedTime,
                revisionId: f.headRevisionId,
                sha256: f.sha256Checksum,
                size: f.size ? + f.size : undefined
            } satisfies RemoteEntry
        )
    }

    return {
        success: true as const,
        data: mapped
    }
}

function clearState(){

}

const syncEngine = {
    requestSync,
    queueForSync,
    cloudVaultScan,
    getRemoteSnapshot
} satisfies SyncEngine;

export { syncEngine, getSyncCandidates };
