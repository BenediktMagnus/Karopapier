export abstract class FrontendUtils
{
    public static callWhenDocumentIsReady (callback: () => void): void
    {
        if (document.readyState === 'loading')
        {
            document.addEventListener('DOMContentLoaded', callback);
        }
        else
        {
            callback();
        }
    }
}
