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
    isActive: boolean;
}

export interface MapTable extends MapTableInsert
{
    id: number;
}
