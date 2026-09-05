import HashingWorker from "./hashing.worker.ts?worker&inline";
import { WorkerCommand, WorkerResponse } from "./worker.types";





export async function fetchAndHashWholeFile(url: string) {
    const worker = new HashingWorker();
    const startedAt = performance.now();

    try {

        const {resolve, reject, promise} = Promise.withResolvers<WorkerResponse>();

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

        worker.postMessage({
            type: "wholefile",
            url
        } satisfies WorkerCommand);


        const result = await promise;

        if (result.type !== "result") {
            throw new Error(
                `Expected result, received ${result.type}`,
            );
        }

        if (!result.hash) {
            throw new Error(
                "Synthetic hashing returned no hash",
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