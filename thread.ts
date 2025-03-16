type ThreadMessage = {
    route:string;
    content:any;
}

export class ThreadObject {

    protected _listeners:{[key:string]: Function}
    protected _thread:Worker;;

    constructor(thread:Worker) {
        this._thread = thread;
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

    send(route:string, content:any, transferables:Transferable[] = []) {
        return new Promise((resolve, reject) => {
            this._thread.addEventListener('error', reject);
            this._thread.addEventListener('message', (event) => {
                const message:ThreadMessage = event.data;
                if(message.route == route) resolve(message.content);
            });
            this._thread.postMessage({route, content}, transferables);
        });
    }
}

export class SharedThread {

    protected _listeners:{[key:string]: Function}
    protected _thread:SharedWorker

    constructor(thread:SharedWorker) {
        this._thread = thread;
        this._listeners = { };
        this._thread.port.addEventListener('message',this._onmessage.bind(this));
    }

    private _onmessage(event:MessageEvent) {
        const {route, content} = event.data;
        if(this._listeners[route]) this._listeners[route](content);
    }

    listen(route:string, method:Function) {
        this._listeners[route] = method;
    }

    deafen(route:string) {
        delete this._listeners[route];
    }

    send(route:string, content:any, transferables:Transferable[] = []) {
        return new Promise((resolve, reject) => {
            this._thread.port.addEventListener('error', reject);
            this._thread.port.addEventListener('message', (event) => {
                const message:ThreadMessage = event.data;
                if(message.route == route) resolve(message.content);
            });
            this._thread.port.postMessage({route, content}, transferables);
        });
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

export class SharedWorkerThread {

    protected _listeners:{[key:string]: Function}
    protected _port:MessagePort;

    constructor( port:MessagePort ) {
        this._port = port;
        this._listeners = { };
        this._port.addEventListener('message',this._onmessage.bind(this));
        this._port.start( );
    }

    get port( ) {
        return this._port;
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
        this._port.postMessage({route, content});
    }

}