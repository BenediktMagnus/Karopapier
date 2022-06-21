import { ApiError } from './apiError';
import ClientToServerEvents from '../../../shared/scripts/clientToServerEvents';

export default abstract class ApiErrorMessage
{
    public static forge (functionName: (keyof ClientToServerEvents)|'Error', apiError: ApiError): string
    {
        return `${functionName}: ${apiError}`;
    }
}
