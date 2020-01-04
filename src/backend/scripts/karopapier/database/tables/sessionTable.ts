export default interface SessionTable
{
	id: number;
	userId: number;
	token: string;
	lastAccess: number;
}
