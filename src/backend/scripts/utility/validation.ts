export default abstract class Validation
{
    /**
     * Checks if a database ID is valid.
     * @param id The numeric ID.
     */
    public static isValidId (id: number): boolean
    {
        const isValid = Number.isSafeInteger(id) && (id > 0);

        return isValid;
    }

    public static isNonEmptyString (value: string): boolean
    {
        const result = (typeof value === 'string') && (value.length > 0);

        return result;
    }
}
