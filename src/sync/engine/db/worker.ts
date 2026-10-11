import SQLiteESMFactory from "@journeyapps/wa-sqlite/dist/wa-sqlite.mjs";
import * as SQLite from "@journeyapps/wa-sqlite";
import { OPFSCoopSyncVFS }
    from "@journeyapps/wa-sqlite/src/examples/OPFSCoopSyncVFS.js";
import type { RemoteEntry } from "../types";

const VFS_NAME = "rpg-opfs";

type DbConnection = {
    sqlite: SQLiteAPI,
    db: number
}


export type SyncDbRequest =
    | {
        requestId: string;
        type: "initialize";
        databaseName: string;
    }
    | {
        requestId: string;
        type: "replace-remote-snapshot";
        rootFolderId: string;
        entries: RemoteEntry[];
    }
    | {
        requestId: string;
        type: "read-remote-snapshot";
    }
    | {
        requestId: string;
        type: "close";
    };

type BaseSyncResponse<T extends string, TExtra extends Record<string, unknown> = {}> = 
| {
    requestId: string;
    type: T;
    success: true
} & TExtra
| {
    requestId: string;
    type: T;
    success: false;
    message: string;
};


export type SyncDbResponse =

    | BaseSyncResponse<"replace-remote-snapshot">
    | BaseSyncResponse<"read-remote-snapshot", {
        rootFolderId: string;
        entries: RemoteEntry[];
    }>
    | BaseSyncResponse<"initialize">
    | BaseSyncResponse<"close">
    | {
        requestId: string;
        type: "error";
        message: string;
    };


function worker(){

    let connection: DbConnection;
    let state: 'open'| 'closed' = 'closed';
    let schemaState: 'initialized' | 'empty' = 'empty';

    function connectionState() {
        if(!connection) return 'undefined' as const;
        return state;
    }

    function getSchemaState() {
        return schemaState;
    }

    async function openConnection(dbName: string) {
        const module = await SQLiteESMFactory();
        const sqlite = SQLite.Factory(module);
    
        const vfs = await OPFSCoopSyncVFS.create(
            VFS_NAME,
            module
        );
    
        sqlite.vfs_register(vfs, true);
    
        const db = await sqlite.open_v2(
            dbName,
            SQLite.SQLITE_OPEN_READWRITE |
                SQLite.SQLITE_OPEN_CREATE,
            VFS_NAME
        );

        state = 'open';
    
        connection = {
            sqlite,
            db,
        };
    }

    async function closeConnection(){
        await connection.sqlite.close(connection.db);
        state = 'closed';
    }

    async function initRemoteEntryTable(){
        await connection.sqlite.exec(connection.db, `--sql
            CREATE TABLE IF NOT EXISTS remote_entry (
                drive_id       TEXT PRIMARY KEY,
                parent_id      TEXT NOT NULL,
                parent_path    TEXT NOT NULL,
                name           TEXT NOT NULL,
                item_type      TEXT NOT NULL,
                sha256         TEXT,
                revision_id    TEXT,
                size           INTEGER,
                modified_time  TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_remote_entry_path
                ON remote_entry(parent_path, name);
        `)
    }

    async function initRemoteSnapshotTable(){
        await connection.sqlite.exec(connection.db, `--sql
            CREATE TABLE IF NOT EXISTS remote_snapshot (
                singleton      INTEGER PRIMARY KEY CHECK (singleton = 1),
                root_folder_id TEXT NOT NULL,
                completed_at   INTEGER NOT NULL
            );
        `)
    }
    
    async function initializeSchema(){
        const initRemoteEntryPromise = initRemoteEntryTable();
        const initRemoteSnapshotPromise = initRemoteSnapshotTable();
        await Promise.all([initRemoteEntryPromise, initRemoteSnapshotPromise])
        schemaState = 'initialized'
    }
    
    async function replaceRemoteSnapshot(data: {
        requestId: string;
        type: "replace-remote-snapshot";
        rootFolderId: string;
        entries: RemoteEntry[];
    }){
    
        const { sqlite, db } = connection;
        try {
            await sqlite.exec(db, `BEGIN`)
            await sqlite.exec(db, `--sql
                DELETE FROM remote_entry where 1=1;
                DELETE FROM remote_snapshot where 1=1;
            `)

            const insertSnapshotSql = `--sql
                INSERT INTO remote_snapshot (singleton, root_folder_id, completed_at)
                VALUES (1, ?, ?);
            `;

            for await (const stmt of sqlite.statements(db, insertSnapshotSql)) {
                sqlite.bind_collection(stmt, [
                    data.rootFolderId,
                    Date.now()
                ]);
                await sqlite.step(stmt);
                await sqlite.reset(stmt);
                sqlite.clear_bindings(stmt);
            }

            const insertEntriesSql = `--sql
                INSERT INTO remote_entry (
                    drive_id, parent_id, parent_path, name, item_type,
                    sha256, revision_id, size, modified_time
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            `;

            for await (const stmt of sqlite.statements(db, insertEntriesSql)) {
                for (const entry of data.entries) {
                    sqlite.bind_collection(stmt, [
                        entry.id,
                        entry.parentId,
                        entry.path,
                        entry.name,
                        entry.type,
                        entry.sha256 ?? null,
                        entry.revisionId ?? null,
                        entry.size ?? null,
                        entry.modifiedTime ?? null,
                    ]);

                    await sqlite.step(stmt);
                    await sqlite.reset(stmt);
                    sqlite.clear_bindings(stmt);
                }
            }
            await sqlite.exec(db, `COMMIT`)
            return {
                success: true as const
            }
        } catch (error) {
            await sqlite.exec(db, `ROLLBACK`)
            return {
                success: false as const,
                message: (error as Error).message
            }
        }

    }
    
    async function readRemoteSnapshot(){

        const snapshot: RemoteEntry[] = [];
        let rootFolderId: string = '';
        let snapshotDate = 0;

        try {
            await connection.sqlite.exec(connection.db, `BEGIN`)
            await connection.sqlite.exec(connection.db, `--sql
                SELECT rs.root_folder_id, rs.completed_at
                FROM remote_snapshot rs
                WHERE rs.singleton = 1
            `,
                (row, _) => {
                    rootFolderId = row[0] as string;
                    snapshotDate = row[1] as number;
                }
            )

            if(!rootFolderId){
                await connection.sqlite.exec(connection.db, `COMMIT`)
                return {
                    success: false as const,
                    message: 'No snapshot found',
                    entries: []
                }
            }

            await connection.sqlite.exec(connection.db, `--sql
                SELECT 
                drive_id AS id,
                parent_id AS parentId,
                parent_path AS path,
                name,
                item_type AS type,
                sha256,
                revision_id AS revisionId,
                size,
                modified_time AS modifiedTime
                FROM remote_entry re
            `,
                (row, columns) => {
                    const result = Object.fromEntries(
                        columns.map((column, index) => [
                            column,
                            row[index],
                        ])
                    )
                    snapshot.push(result as RemoteEntry);
                }
            )
            await connection.sqlite.exec(connection.db, `COMMIT`)
        } catch (error) {
            console.error("Error reading remote snapshot:", error);
            await connection.sqlite.exec(connection.db, `ROLLBACK`)
            return {
                success: false as const,
                message: 'Error reading sync snapshot',
                entries: []
            }
        }

        return {
            success: true as const,
            rootFolderId,
            snapshotDate,
            entries: snapshot
        }
    }

    return {
        connectionState,
        getSchemaState,
        openConnection,
        closeConnection,
        initializeSchema,
        replaceRemoteSnapshot,
        readRemoteSnapshot,
    }
}

let Worker : ReturnType<typeof worker>;


self.onmessage = async (
    event: MessageEvent<SyncDbRequest>
) => {

    Worker ??= worker()
    switch (event.data.type) {
        case 'initialize':
            try {
                let connState = Worker.connectionState();
                let schemaState = Worker.getSchemaState();
                if(connState != 'open')
                    await Worker.openConnection(event.data.databaseName)
                if(schemaState == 'empty')
                    await Worker.initializeSchema()
    
                self.postMessage({
                    requestId: event.data.requestId,
                    type: 'initialize',
                    success: true
                } satisfies SyncDbResponse)
                
            } catch (error) {
                self.postMessage({
                    requestId: event.data.requestId,
                    type: 'initialize',
                    success: false,
                    message: (error as Error).message
                } satisfies SyncDbResponse)
            }
            break;
    
        case 'close':
            let msg = {requestId: event.data.requestId, type: 'close'} satisfies Omit<SyncDbResponse, 'success' | 'message'>;
            try {
                await Worker.closeConnection();
                (msg as BaseSyncResponse<'close'>).success = true;
            } catch (error) {
                (msg as BaseSyncResponse<'close'>).success = false;
                (msg as Extract<BaseSyncResponse<'close'>, { message: string }>).message = (error as Error).message;
            }
            self.postMessage(msg)  
            break;

        case 'read-remote-snapshot': {
            const result = await Worker.readRemoteSnapshot()
            self.postMessage(
                result.success ? {
                    type: 'read-remote-snapshot',
                    requestId: event.data.requestId,
                    success: true,
                    rootFolderId: result.rootFolderId,
                    entries: result.entries
                }
                : {
                    requestId: event.data.requestId,
                    type: 'read-remote-snapshot',
                    success: false,
                    message: result.message
                } satisfies SyncDbResponse)
            break;
        }

        case 'replace-remote-snapshot': {
            const result = await Worker.replaceRemoteSnapshot(event.data)
            self.postMessage({
                requestId: event.data.requestId,
                type: 'replace-remote-snapshot',
                ...result
            } satisfies SyncDbResponse)
            break;
        }

        default:
            break;
    }
    

}
