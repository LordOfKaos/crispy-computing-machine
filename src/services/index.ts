import type { DataService } from './dataService';
import { MockDataService } from './mockDataService';
import { DataverseDataService } from './dataverseService';

export type { DataService } from './dataService';

function createDataService(): DataService {
  if (import.meta.env.VITE_DATA_SOURCE === 'dataverse') {
    const url = import.meta.env.VITE_DATAVERSE_URL;
    if (!url) throw new Error('VITE_DATAVERSE_URL must be set when VITE_DATA_SOURCE=dataverse');
    // TODO: replace with an MSAL token acquisition, e.g.
    // msal.acquireTokenSilent({ scopes: [`${url}/user_impersonation`] })
    const getToken = async () => {
      throw new Error('Dataverse authentication is not configured yet');
    };
    return new DataverseDataService(url, getToken);
  }
  return new MockDataService();
}

export const dataService = createDataService();
