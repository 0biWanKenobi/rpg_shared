import type { SyncDbRequest, SyncDbResponse } from './worker';
import Worker from './worker?worker&inline';


function createSyncStore(databaseName: string){


    let  worker: Worker;

    type PromiseResolve<T> = (value: T | PromiseLike<T>) => void;
    type ReadResponse =  Extract<SyncDbResponse, { type: 'read-remote-snapshot' }>;
    type ReplaceResponse =  Extract<SyncDbResponse, { type: 'replace-remote-snapshot' }>;
    type InitializeResponse =  Extract<SyncDbResponse, { type: 'initialize' }>;
    type CloseResponse =  Extract<SyncDbResponse, { type: 'close' }>;

    const responseQueue = new Map<string, PromiseResolve<SyncDbResponse>>();

    async function initialize(): Promise<InitializeResponse> {
        worker ??= new Worker();

        const requestId = crypto.randomUUID();
        const {promise, resolve} = Promise.withResolvers<SyncDbResponse>();
        responseQueue.set(requestId, resolve);
        worker.postMessage({
            type: 'initialize',
            requestId,
            databaseName
        } satisfies SyncDbRequest);


        worker.onmessage = (event: MessageEvent<SyncDbResponse>) => {
            switch(event.data.type){
                case 'read-remote-snapshot':
                case 'replace-remote-snapshot':
                case 'initialize':
                case 'error':
                case 'close':
                    parseResponse(event.data)
                    break;
            }
        }

        return promise as Promise<InitializeResponse>;
    }

    async function sendRequest(request: SyncDbRequest): Promise<SyncDbResponse> {
        const {promise, resolve} = Promise.withResolvers<SyncDbResponse>();
        responseQueue.set(request.requestId, resolve);

        worker.postMessage(request);

        return promise;
    }

    async function parseResponse(response: SyncDbResponse){
        const resolve = responseQueue.get(response.requestId);
        if(resolve){
            responseQueue.delete(response.requestId);
            resolve(response)
        }
    }

    async function replaceRemoteSnapshot({
        rootFolderId,
        entries
    }: {
        rootFolderId: string,
        entries: any[]
    }): Promise<ReplaceResponse> {        
        return await sendRequest({
            type: 'replace-remote-snapshot',
            requestId: crypto.randomUUID(),
            rootFolderId,
            entries
        } satisfies SyncDbRequest) as ReplaceResponse;
    }

    async function readRemoteSnapshot() {
        return await sendRequest({
            type: 'read-remote-snapshot',
            requestId: crypto.randomUUID()
        } satisfies SyncDbRequest) as ReadResponse;
    }
    

    async function close(){
        const result = await sendRequest({
            type: 'close',
            requestId: crypto.randomUUID()
        } satisfies SyncDbRequest)

        worker.terminate();
        worker = undefined as unknown as Worker;
        

        return result as CloseResponse;
    }

    return {
        initialize,
        replaceRemoteSnapshot,
        readRemoteSnapshot,
        close
    }

}


export {
    createSyncStore
}