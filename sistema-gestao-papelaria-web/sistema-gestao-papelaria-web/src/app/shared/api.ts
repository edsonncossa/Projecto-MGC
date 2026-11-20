import { environment } from '../../environments/environment';

/** Base do backend, sem barra final. Ex.: 'http://localhost:8080'.
 *  ADAPTAR: use a mesma constante que o seu AuthService já usa para chamar /auth/signin. */
export const API_URL: string = environment.apiURL;