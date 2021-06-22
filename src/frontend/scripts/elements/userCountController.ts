/**
 * Used to manage a user count element by automatically updating its content on changes.
 */
export default class UserCountController
{
    private parentElement: HTMLElement;
    private countSpan: HTMLSpanElement;

    constructor (parentElementId: string)
    {
        const parentElement = document.getElementById(parentElementId);

        if (parentElement === null)
        {
            throw new ReferenceError('The given user count parent element could not be found.');
        }
        else
        {
            this.parentElement = parentElement;
        }

        this.countSpan = this.parentElement.firstElementChild as HTMLSpanElement;
    }

    /**
     * Must be called when the user count changes.
     * @param userCount The new user count.
     */
    public onChange (userCount: number): void
    {
        this.countSpan.textContent = `${userCount}`;
    }
}
