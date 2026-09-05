// hash-worker.types.ts

export type WorkerCommand =
    // Optimized candidate: worker fetches the file itself
    | {
        type: "noble";
        url: string;
    }
    | {
        type: "wholefile";
        url: string
    }
    
    ;

export interface WorkerStats {
    elapsedMs: number;
    bytes: number;
    chunkCount: number;
    minChunkSize: number;
    maxChunkSize: number;
    averageChunkSize: number;
}

export type WorkerResponse =
    | {
        type: "result";
        hash?: string;
        stats: WorkerStats;
    }
    | {
        type: "error";
        message: string;
    };


import type { sha256 } from "@noble/hashes/sha2.js";

export interface StreamingJob {
    hasher?: ReturnType<typeof sha256.create>;
    startedAt: number;
    bytes: number;
    chunkCount: number;
    minChunkSize: number;
    maxChunkSize: number;
}