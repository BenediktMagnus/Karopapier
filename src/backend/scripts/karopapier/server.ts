import * as http from 'http';
import compression from 'compression';
import express from 'express';
import socketIo from 'socket.io';

export default class Server
{
    public static readonly defaultHttpPort = 80;

    private readonly server: express.Express;
    private readonly http: http.Server;

    private readonly io: socketIo.Server;

    public httpPort: number;

    constructor ()
    {
        this.server = express();

        // Middleware for gzip compression:
        this.server.use(compression());

        // Favicon:
        this.server.use('/favicon.svg', express.static('./files/favicon.svg'));

        // Map and source files:
        if (process.argv.includes('--serveMapFiles'))
        {
            // If explicitely stated in command line (probably by the debugger) serve map and Typescript
            // source files for the Javascript scripts, making debugging in the browser easier:
            this.server.use('/scripts', express.static('./build/frontend', {extensions: ['js', 'js.map']}));
            this.server.use(
                '/src/frontend/scripts',
                express.static('./src/frontend/scripts', {extensions: ['ts']})
            );
        }
        else
        {
            // If not stated in command line, only serve script files from the build directory.
            // We do not want map and source files in a production environment!
            this.server.use('/scripts', express.static('./build/frontend', {extensions: ['js']}));
        }

        // Serving of html files on root level without extension:
        this.server.use('/', express.static('./files/html', {extensions: ['html']}));
        // Serving of static resources:
        this.server.use('/css', express.static('./files/css'));
        this.server.use('/images', express.static('./files/images'));

        this.httpPort = Server.defaultHttpPort;

        this.http = new http.Server(this.server);

        this.io = socketIo(this.http);
    }

    public get socketIo (): socketIo.Server
    {
        return this.io;
    }

    public start (): void
    {
        this.http.listen(this.httpPort);
    }

    public async stop (): Promise<void>
    {
        // Transformation of a callback to a promise for the async function:
        const promise = new Promise(
            (resolve, reject) =>
            {
                this.http.close(
                    error =>
                    {
                        if (error)
                        {
                            reject(error);
                        }
                        else
                        {
                            resolve();
                        }
                    }
                );
            }
        );

        await promise;
    }
}
