export interface MapTableInsert
{
    /**
     * Identifies a map distinctly, used to select maps in URLs. \
     * Must only contain characters allowed in URL query strings.
     */
    publicIdentifier: string;
    /**
     * Human readable name for the map.
     */
    name: string;
    /**
     * True if it is allowed to load the map and view or change it's content.
     */
    isActive: boolean;
    /**
     * The width of the map, defining the minimum and maximum x coordinates.
     */
    width: number;
    /**
     * The height of the map, defining the minimum and maximum y coordinates.
     */
    height: number;
}

export interface MapTable extends MapTableInsert
{
    id: number;
}
