import type { WorkerResponse, WorkerStats, WorkerCommand, StreamingJob } from "./worker.types";
import { nobleHashing } from "./hashing.noble.impl";
import { fetchAndHashWholeFile } from "./hashing.wholefile.impl";



function respond(response: WorkerResponse): void {
    self.postMessage(response);
}


function getStats(job: StreamingJob): WorkerStats {
    return {
        elapsedMs: performance.now() - job.startedAt,
        bytes: job.bytes,
        chunkCount: job.chunkCount,
        minChunkSize:
            job.chunkCount === 0 ? 0 : job.minChunkSize,
        maxChunkSize: job.maxChunkSize,
        averageChunkSize:
            job.chunkCount === 0
                ? 0
                : job.bytes / job.chunkCount,
    };
}


self.onmessage = async (
    event: MessageEvent<WorkerCommand>,
) => {
    try {
        const command = event.data;

        switch (command.type) {
            case "noble":
                const {
                    hash,
                    job: cu
                } = await nobleHashing(command.url);
                respond({
                    type: "result",
                    hash,
                    stats: getStats(cu),
                });
                break;
            case "wholefile": {
                const startedAt = performance.now();
                const { hash, bytes } = await fetchAndHashWholeFile(command.url);

                respond({
                    type: "result",
                    hash,
                    stats: {
                        bytes,
                        elapsedMs: performance.now() - startedAt,
                        chunkCount: bytes === 0 ? 0 : 1,
                        minChunkSize: bytes,
                        maxChunkSize: bytes,
                        averageChunkSize: bytes,
                    },
                });
                break;
            }
        }
    } catch (error) {

        respond({
            type: "error",
            message:
                error instanceof Error
                    ? error.message
                    : String(error),
        });
    }
};