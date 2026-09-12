import type { drive_v3 } from "@googleapis/drive/build/v3";
import type { TAbstractFile } from "obsidian";
import type { VaultScanParams } from "./main";
import type { Result } from "../../types";


export type VaultEvent = 'create' | 'modify' | 'delete' | 'rename';

export type ChangeData = {
    path: string;
    prevPath?: string;
}

export type RemoteEntry = {
    id: string;
    parentId: string;
    path: string;
    name: string;
    type: "file" | "folder";
    sha256?: string | null;
    revisionId?: string | null;
    size?: number | null;
    modifiedTime?: string | null;
};

export type SyncEngine = {
    requestSync: (
        onStart: () => void,
        onProgress: (progress: number) => void,
        onComplete: () => void,
        onError: (error: Error) => void
    ) => {
        success: boolean;
        message: string;
    },
    queueForSync: (file: TAbstractFile, event: VaultEvent, oldPath?: string) => void,
    cloudVaultScan(params: VaultScanParams): Promise<Result<drive_v3.Schema$File[]>>,
    getRemoteSnapshot(params: VaultScanParams): Promise<Result<RemoteEntry[]>>
}

/**
 * Last state accepted by the sync engine for a given file.
 * The full contents of this revision are stored in the cloud, identified by
 * driveFileId plus revisionId.
 * 
 * Locally, the file is identified by its path and sha256 hash.
 */
export type BaselineState = {
    driveFileId: string;
    revisionId: string;
    path: string;
    sha256: string;
    deleted: boolean;
};

export type SyncState = {
    /**
     * true when engine received complete inventory of cloud files.
     */
    remoteInventoryComplete: boolean;
}