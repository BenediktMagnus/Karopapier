import Karopapier from "./karopapier";

class Main
{
    private applicationIsRunning = false;

    private karopapier: Karopapier|null = null;

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

            if (this.karopapier)
            {
                this.karopapier.terminate();
            }

            console.log("\nKaropapier closed.");
        }
    }

    public run (): void
    {
        console.log('Karopapier is starting...');

        this.applicationIsRunning = true;

        this.karopapier = new Karopapier();

        console.log('Karopapier started.');
    }
}

const main = new Main();
main.run();
