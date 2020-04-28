export default abstract class Utils
{
    public static getCurrentUnixTime (): number
    {
        return Math.floor(new Date().getTime() / 1000);
    }

    public static catchVoidPromise (promiseReturner: (...args: any[]) => Promise<void>): (...args: any[]) => void
    {
        const arrowFunction = (...args: any[]): void =>
        {
            promiseReturner(args).catch(
                (error) =>
                {
                    console.error(error);
                }
            );
        };

        return arrowFunction;
    }
}
