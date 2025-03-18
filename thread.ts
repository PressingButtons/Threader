type ThreadMessage = {
    route:string;
    content:any;
}

export class ThreadObject {

    protected _listeners:{[key:string]: Function}
    protected _thread:Worker;

    constructor(url:URL|string) {
        this._thread = new Worker(url, {type:'module'});
        this._listeners = { };
        this._thread.addEventListener('message',this._onmessage.bind(this));
    }

    private async _onmessage(event:MessageEvent) {
        const {route, content} = event.data;
        if(this._listeners[route]) this._listeners[route](content);
    }

    listen(route:string, method:Function) {
        this._listeners[route] = method;
    }

    deafen(route:string) {
        delete this._listeners[route];
    }

    request(route:string, content:any, transferables:Transferable[] = []) {
        return new Promise((resolve, reject) => {
            this._thread.addEventListener('error', reject);
            this._thread.addEventListener('message', (event) => {
                const message:ThreadMessage = event.data;
                if(message.route == route) resolve(message.content);
            });
            this.send(route, content, transferables);
        });
    }

    send(route:string, content:any, transferables:Transferable[] = []) {
        this._thread.postMessage({route, content}, transferables);
    }
}

export class WorkerThread {

    protected _listeners:{[key:string]: Function}
    protected _thread:(Window & typeof globalThis)

    constructor( thread:(Window & typeof globalThis) ) {
        this._thread = thread;
        this._listeners = { };
        this._thread.addEventListener('message',this._onmessage.bind(this));
    }

    private async _onmessage(event:MessageEvent) {
        const {route, content} = event.data;
        if(this._listeners[route]) {
            const result = await this._listeners[route](content);
            this.send(route, result);
        }
    }

    listen(route:string, method:Function) {
        this._listeners[route] = method;
    }

    deafen(route:string) {
        delete this._listeners[route];
    }

    send(route:string, content:any) {
        this._thread.postMessage({route, content});
    }
}