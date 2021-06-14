export default class EventHandler<T extends CallableFunction>
{
    private events: Set<T>;

    constructor ()
    {
        this.events = new Set<T>();
    }

    public addEventListener (event: T): void
    {
        this.events.add(event);
    }

    public removeEventListener (event: T): void
    {
        this.events.delete(event);
    }

    public dispatchEvent (...args: unknown[]): void
    {
        for (const event of this.events)
        {
            event(...args);
        }
    }
}
