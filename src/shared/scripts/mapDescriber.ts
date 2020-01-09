export default class MapDescriber
{
    public id: number;
    public name: string;

    constructor (mapDescriber: MapDescriber)
    {
        // With this constructor everything that can be considered a MapDescriber (in it's function as an
        // interface) is being converted into a MapDescriber (in it's function as a class) without any
        // unrelated properties or methods.

        this.id = mapDescriber.id;
        this.name = mapDescriber.name;
    }
}

