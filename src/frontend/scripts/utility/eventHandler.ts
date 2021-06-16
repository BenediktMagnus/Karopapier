export default class EventHandler<T extends (...args: any[]) => void>
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

    public dispatchEvent (...args: Parameters<T>): void
    {
        for (const event of this.events)
        {
            event(...args);
        }
    }
}
