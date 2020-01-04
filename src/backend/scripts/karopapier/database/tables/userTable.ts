export interface UserTableInsert
{
    name: string;
    passwordHash: string;
    isAdmin: boolean;
}

export interface UserTable extends UserTableInsert
{
    id: number;
}
