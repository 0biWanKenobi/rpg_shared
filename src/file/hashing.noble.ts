// hashing.url.ts

import HashingWorker from "./hashing.worker.ts?worker&inline";
import type {
    WorkerCommand,
    WorkerResponse,
} from "./worker.types";

export type UrlProcessingResult = {
    hash?: string;
    bytes: number;
    elapsedMs: number;
    chunkCount: number;
    minChunkSize: number;
    maxChunkSize: number;
};

export async function nobleHash(
    url: string,
): Promise<UrlProcessingResult> {
    const worker = new HashingWorker();
    const startedAt = performance.now();

    try {
        const resultPromise = new Promise<WorkerResponse>(
            (resolve, reject) => {
                worker.onmessage = event => {
                    const response = event.data;

                    if (response.type === "error") {
                        reject(new Error(response.message));
                        return;
                    }

                    resolve(response);
                };

                worker.onerror = event => {
                    reject(
                        event.error ??
                        new Error(event.message),
                    );
                };
            },
        );

        worker.postMessage({
            type: "noble",
            url,
        } satisfies WorkerCommand);

        const result = await resultPromise;

        if (result.type !== "result") {
            throw new Error(
                `Expected result, received ${result.type}`,
            );
        }

        return {
            hash: result.hash,
            bytes: result.stats.bytes,
            elapsedMs: performance.now() - startedAt,
            chunkCount: result.stats.chunkCount,
            minChunkSize: result.stats.minChunkSize,
            maxChunkSize: result.stats.maxChunkSize,
        };
    } finally {
        worker.terminate();
    }
}