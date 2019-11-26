class Main
{
    private applicationIsRunning = false;

    constructor ()
    {
        const terminateFunction = (): void => this.terminate();

        process.on('exit', terminateFunction);
        process.on('SIGINT', terminateFunction); // Ctrl + C
        process.on('SIGHUP', terminateFunction); // Terminal closed
        process.on('SIGTERM', terminateFunction); // "kill pid" / "killall"
        process.on('SIGUSR1', terminateFunction); // "kill -SIGUSR1 pid" / "killall -SIGUSR1"
        process.on('SIGUSR2', terminateFunction); // "kill -SIGUSR2 pid" / "killall -SIGUSR2"
    }

    /**
     * Terminate all running connections and report about the closing programme.
     */
    public terminate (): void
    {
        if (this.applicationIsRunning)
        {
            this.applicationIsRunning = false;

            // TODO: Do something at shutdown.

            console.log("\nKaropapier closed.");
        }
    }

    public run (): void
    {
        console.log('Karopapier is starting...');

        this.applicationIsRunning = true;

        // TODO: Do something at startup.

        console.log('Karopapier started.');
    }
}

const main = new Main();
main.run();
