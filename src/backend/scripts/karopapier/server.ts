import * as http from 'http';
import compression from 'compression';
import express from 'express';

export default class Server
{
    public static readonly defaultHttpPort = 80;

    protected readonly server: express.Express;
    protected readonly http: http.Server;

    public httpPort: number = Server.defaultHttpPort;

    constructor ()
    {
        this.server = express();

        // Middleware for gzip compression:
        this.server.use(compression());
        // Serving of static files:
        this.server.use('/', express.static('./files/html', {extensions: ['html']}));
        this.server.use('/css', express.static('./files/css'));
        this.server.use('/images', express.static('./files/images'));

        this.http = new http.Server(this.server);
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
