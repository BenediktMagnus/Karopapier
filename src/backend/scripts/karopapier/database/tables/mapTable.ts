export interface MapTableInsert
{
    name: string;
    isActive: boolean;
}

export interface MapTable extends MapTableInsert
{
    id: number;
}
