export interface ContentTableInsert
{
    publicIdentifier: string;
    name: string;
}

export interface ContentTable extends ContentTableInsert
{
    id: number;
}
