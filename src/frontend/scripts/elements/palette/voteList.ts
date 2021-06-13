import { MapContent } from "../../shared/map";

export default class VoteList
{
    private mainElement: HTMLDivElement;

    constructor ()
    {
        const mainElement = document.getElementById('voteList') as HTMLDivElement;

        if (mainElement === null)
        {
            throw new ReferenceError('The voteList element could not be found.');
        }
        else
        {
            this.mainElement = mainElement;
        }
    }

    /**
     * Initialise the element by creating and preparing all necessary subelements.
     * @param mapContents The list of map contents, needed to determine the needed subelements.
     */
    public initialise (mapContents: MapContent[]): void
    {
        console.log(mapContents.length);
        console.log(this.mainElement.isConnected);
        //for (const mapContent of mapContents)
        //{
        //    mapContent.
        //}
    }
}
