import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import type { StreamingJob } from "./worker.types";

function createJob(): StreamingJob {
    return {
        hasher: sha256.create(),
        startedAt: performance.now(),
        bytes: 0,
        chunkCount: 0,
        minChunkSize: Number.POSITIVE_INFINITY,
        maxChunkSize: 0,
    };
}

export async function nobleHashing(
    url: string,
): Promise<{ hash?: string; job: StreamingJob }> {
    const job = createJob();
    const response = await fetch(url);

    if (!response.body) {
        throw new Error("ReadableStream is unavailable");
    }

    const reader = response.body.getReader();

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            processChunk(job, value);
        }

        const hash =  job.hasher
            ? bytesToHex(job.hasher.digest())
            : undefined;

        return {
            hash,
            job
        }
    } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
    }
}

function processChunk(
    job: StreamingJob,
    chunk: Uint8Array<ArrayBuffer>,
): void {
    const size = chunk.byteLength;

    job.bytes += size;
    job.chunkCount++;
    job.minChunkSize = Math.min(job.minChunkSize, size);
    job.maxChunkSize = Math.max(job.maxChunkSize, size);

    job.hasher?.update(chunk);
}