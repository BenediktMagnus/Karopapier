export default class EventHandler<T extends Function>
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

    public dispatchEvent (...args: any): void
    {
        for (const event of this.events)
        {
            event(...args);
        }
    }
}
