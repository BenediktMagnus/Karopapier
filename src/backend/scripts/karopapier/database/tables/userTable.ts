export default interface UserTable
{
    id: number;
    name: string;
    passwordHash: string;
    sessionId: string;
    isAdmin: boolean;
}
